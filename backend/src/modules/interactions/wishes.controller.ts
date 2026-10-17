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
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateWishDto, UpdateWishApprovalDto } from './dto/create-wish.dto';
import { WishesService } from './wishes.service';

/**
 * Sổ lưu bút phía khách mời — không đăng nhập. Đây là bề mặt ghi công khai duy
 * nhất của cả hệ thống nên nó bị siết chặt hơn hạn mức chung.
 */
@Controller('public/cards/:slug/wishes')
export class PublicWishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Get()
  findApproved(@Param('slug') slug: string) {
    return this.wishesService.findApprovedBySlug(slug);
  }

  // 5 lời chúc mỗi 10 phút cho mỗi IP: đủ cho một nhóm bạn ngồi cùng wifi viết
  // cho nhau, chặn được kịch bản đổ hàng loạt.
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @Post()
  create(@Param('slug') slug: string, @Body() dto: CreateWishDto) {
    return this.wishesService.createFromGuest(slug, dto);
  }
}

/** Duyệt và xoá lời chúc — quyền của chủ thiệp, backend thực thi. */
@Controller('cards/:cardId/wishes')
@UseGuards(JwtAuthGuard)
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.wishesService.findAllForOwner(cardId, user.userId);
  }

  @Patch(':wishId/approve')
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('wishId', ParseUUIDPipe) wishId: string,
    @Body() dto: UpdateWishApprovalDto,
  ) {
    return this.wishesService.setApproved(
      cardId,
      wishId,
      user.userId,
      dto.approved,
    );
  }

  @Delete(':wishId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('wishId', ParseUUIDPipe) wishId: string,
  ) {
    return this.wishesService.remove(cardId, wishId, user.userId);
  }
}

/**
 * Số lời chúc chờ duyệt theo từng thiệp, cho danh sách "Thiệp của tôi".
 * Endpoint riêng chứ không nhập vào `GET /cards`: xem ghi chú chiều phụ thuộc
 * trong `WishesService.countPendingForOwner`.
 */
@Controller('wishes')
@UseGuards(JwtAuthGuard)
export class WishStatsController {
  constructor(private readonly wishesService: WishesService) {}

  @Get('pending-count')
  countPending(@CurrentUser() user: AuthenticatedUser) {
    return this.wishesService.countPendingForOwner(user.userId);
  }

  /** Tổng lời chúc đã nhận — thẻ số liệu trên trang tài khoản. */
  @Get('count')
  countAll(@CurrentUser() user: AuthenticatedUser) {
    return this.wishesService.countAllForOwner(user.userId);
  }
}
