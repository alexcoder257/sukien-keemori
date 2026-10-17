import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUploadSession } from './decorators/current-upload-session.decorator';
import {
  ClaimStagedPhotosDto,
  RequestUploadsDto,
  StagedPhotoIdsDto,
} from './dto/upload-session.dto';
import { UploadSessionGuard } from './guards/upload-session.guard';
import type { UploadSession } from './upload-session.entity';
import { UploadStagingService } from './upload-staging.service';

/**
 * Đường ảnh của editor — xem `UploadStagingService` cho toàn bộ luồng.
 *
 * Hạn mức đặt **rộng** theo IP, có chủ đích: nhà mạng di động Việt Nam NAT
 * chung địa chỉ, siết theo IP là chặn nhầm cả nghìn khách thật. Tấm chắn chính
 * chống lạm dụng nằm ở chỗ khác — ảnh tạm không có URL công khai, trần số ảnh
 * mỗi phiên, và hàng đợi nén có trần cố định với ảnh ẩn danh đi sau cùng.
 */
@Controller('upload-sessions')
export class UploadSessionsController {
  constructor(private readonly staging: UploadStagingService) {}

  /** Mở phiên — **không** cần đăng nhập. */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 600_000, limit: 30 } })
  create(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.staging.createSession(user?.userId);
  }

  /** Xin chỗ gửi cho cả lô ảnh vừa chọn. */
  @Post('photos')
  @UseGuards(OptionalJwtAuthGuard, UploadSessionGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  requestUploads(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @CurrentUploadSession() session: UploadSession,
    @Body() dto: RequestUploadsDto,
  ) {
    return this.staging.requestUploads(session, dto.items, user?.userId);
  }

  /** Báo đã gửi xong — đưa vào hàng đợi nén. */
  @Post('photos/complete')
  @UseGuards(OptionalJwtAuthGuard, UploadSessionGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  complete(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @CurrentUploadSession() session: UploadSession,
    @Body() dto: StagedPhotoIdsDto,
  ) {
    return this.staging.complete(session, dto.ids, user?.userId);
  }

  /**
   * Chỉ dùng khi `STORAGE_DRIVER=local`: trình duyệt gửi byte thẳng vào đây
   * thay cho presigned URL. Driver `r2` trả 404.
   */
  @Put('photos/:photoId/raw')
  @UseGuards(UploadSessionGuard)
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  receiveDirect(
    @CurrentUploadSession() session: UploadSession,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: Request,
  ) {
    return this.staging.receiveDirect(session, photoId, request);
  }

  /**
   * Bản đã nén của một tấm, cho editor dựng lại ô ảnh lúc khôi phục bản nháp.
   * Một bản nháp có thể mang cả album, nên hạn mức ngang route nhận ảnh.
   */
  @Get('photos/:photoId/preview')
  @UseGuards(UploadSessionGuard)
  @Throttle({ default: { ttl: 60_000, limit: 240 } })
  async preview(
    @CurrentUploadSession() session: UploadSession,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.staging.readPreview(session, photoId);
    // Quyền đọc là token phiên trong header, nên không cache chung được ở
    // bất kỳ tầng nào giữa đường.
    response.set('Cache-Control', 'private, no-store');
    return new StreamableFile(buffer, { type: 'image/avif' });
  }

  @Delete('photos/:photoId')
  @UseGuards(UploadSessionGuard)
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUploadSession() session: UploadSession,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.staging.remove(session, photoId);
  }

  /**
   * Nhận ảnh về thiệp. Editor **gọi lặp** route này cho tới khi mọi tấm xong,
   * nên hạn mức cao hơn hẳn các route khác.
   */
  @Post('claim')
  @UseGuards(JwtAuthGuard, UploadSessionGuard)
  @Throttle({ default: { ttl: 60_000, limit: 240 } })
  claim(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentUploadSession() session: UploadSession,
    @Body() dto: ClaimStagedPhotosDto,
  ) {
    return this.staging.claim(user.userId, session, dto.cardId, dto.ids);
  }
}
