import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
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
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { RsvpsService } from './rsvps.service';

/**
 * Xác nhận tham dự phía khách mời — không đăng nhập. Chỉ có đường **ghi**:
 * không route công khai nào đọc lại danh sách, vì tên người đi người không là
 * dữ liệu riêng của cặp đôi.
 */
@Controller('public/cards/:slug/rsvps')
export class PublicRsvpsController {
  constructor(private readonly rsvpsService: RsvpsService) {}

  // Rộng hơn sổ lưu bút (5): khách vào bằng link riêng được sửa câu trả lời,
  // và đổi ý vài lần trong một buổi là chuyện bình thường.
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @Post()
  submit(@Param('slug') slug: string, @Body() dto: CreateRsvpDto) {
    return this.rsvpsService.submitFromGuest(slug, dto);
  }
}

/** Đọc và xoá phản hồi — quyền của chủ thiệp, backend thực thi. */
@Controller('cards/:cardId/rsvps')
@UseGuards(JwtAuthGuard)
export class RsvpsController {
  constructor(private readonly rsvpsService: RsvpsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.rsvpsService.findAllForOwner(cardId, user.userId);
  }

  @Delete(':rsvpId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('rsvpId', ParseUUIDPipe) rsvpId: string,
  ) {
    return this.rsvpsService.remove(cardId, rsvpId, user.userId);
  }
}
