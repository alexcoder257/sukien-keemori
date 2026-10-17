import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommerceService } from './commerce.service';
import {
  ConfirmPaymentDto,
  CreateOrderDto,
  PreviewVoucherDto,
} from './dto/create-order.dto';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  /** Báo giá gói duy nhất: giá niêm yết, khuyến mãi gói và số phải trả. */
  @Get('quote')
  quote() {
    return this.commerceService.quote();
  }

  /**
   * Thử một mã giảm giá. `POST` chứ không `GET` dù không ghi gì: mã nằm trong
   * body thay vì trên URL nên nó không trôi vào access log của proxy — mã giảm
   * giá là thứ dùng được ngay khi biết chữ.
   */
  @Post('voucher-preview')
  @HttpCode(HttpStatus.OK)
  previewVoucher(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PreviewVoucherDto,
  ) {
    return this.commerceService.previewVoucher(user.userId, dto);
  }

  @Post('available-vouchers')
  @HttpCode(HttpStatus.OK)
  availableVouchers(@CurrentUser() user: AuthenticatedUser) {
    return this.commerceService.availableVouchers(user.userId);
  }

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.commerceService.findMine(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.commerceService.createOrder(user.userId, dto);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commerceService.cancel(user.userId, id);
  }
}

/**
 * Xác nhận thanh toán thủ công của admin — đường cứu hộ khi webhook SePay báo
 * hụt; đi vào cùng `CommerceService.markPaid` như webhook.
 */
@Controller('admin/orders')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('payments:manage')
export class CommerceAdminController {
  constructor(private readonly commerceService: CommerceService) {}

  @Post(':id/confirm-payment')
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.commerceService.markPaid(id, dto);
  }
}
