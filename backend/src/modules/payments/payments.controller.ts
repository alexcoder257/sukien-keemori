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
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import {
  QueryAdminOrdersDto,
  QueryUnmatchedDto,
} from './dto/query-admin-payments.dto';
import { MatchTransactionDto, SepayWebhookDto } from './dto/sepay-webhook.dto';
import { SepayWebhookGuard } from './guards/sepay-webhook.guard';
import { PaymentsService } from './payments.service';
import type { AdminUser } from '@modules/admin-auth/admin-auth.types';
import { CurrentAdmin } from '@modules/admin-auth/decorators/current-admin.decorator';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

/**
 * Webhook của SePay.
 *
 * Ba điểm khác mọi controller còn lại, cả ba đều có chủ đích:
 *
 * 1. **Không có `JwtAuthGuard`** — người gọi là máy chủ SePay, không có phiên
 *    đăng nhập. Thay vào đó là `SepayWebhookGuard` kiểm API key dùng chung.
 * 2. **`@SkipThrottle`** — rate limit toàn cục tính theo IP. SePay bắn từ vài
 *    IP cố định, và một ngày cưới có thể dồn nhiều giao dịch trong ít phút;
 *    chặn ở đây là tự đánh rơi tiền của khách.
 * 3. **Luôn trả `{ success: true }`** — SePay coi mọi thứ khác là thất bại và
 *    thử lại. Giao dịch không ghép được đơn vẫn đã được ghi nhận thành công.
 */
@Controller('payments/sepay')
export class SepayWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @UseGuards(SepayWebhookGuard)
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async receive(@Body() dto: SepayWebhookDto): Promise<{ success: true }> {
    await this.paymentsService.handleSepayWebhook(dto);
    return { success: true };
  }
}

/**
 * Phần công khai, không đăng nhập: trang Thông tin doanh nghiệp công bố tài
 * khoản nhận tiền để khách đối chiếu tên người nhận trước khi chuyển.
 *
 * Controller riêng vì `PaymentsController` gắn `JwtAuthGuard` ở cấp lớp.
 * Không lộ thêm gì: số tài khoản này vốn đã nằm trong mã QR của mọi đơn.
 */
@Controller('payments')
export class PaymentsPublicController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Bọc trong `account` vì Nest trả thân rỗng cho `null`, không phải JSON. */
  @Get('receiving-account')
  receivingAccount() {
    return { account: this.paymentsService.receivingAccount() };
  }
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Thông tin thanh toán của một đơn: số tài khoản, mã đơn và ảnh QR.
   *
   * Màn chờ thanh toán hỏi lại route này để biết đơn đã sang `paid` chưa, nên
   * hạn mức phải đủ rộng cho việc hỏi vài giây một lần trong lúc khách chuyển
   * khoản — nhưng không rộng tới mức thành đường quét đơn của người khác.
   */
  @Get('checkout/:orderId')
  @Throttle({ default: { limit: 120, ttl: 5 * 60_000 } })
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.paymentsService.checkout(user.userId, orderId);
  }
}

/**
 * Màn tra soát ở CMS. Payload gốc chứa tên và số tài khoản người gửi — dữ liệu
 * cá nhân — nên nhánh này đóng ở quyền `admin`, không có bản công khai.
 */
@Controller('admin/payments')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('payments:manage')
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Đơn mua thiệp kèm tiền vào đã ghép — màn tra cứu khi khách báo sự cố. */
  @Get('orders')
  findOrders(@Query() query: QueryAdminOrdersDto) {
    return this.paymentsService.findOrders(query);
  }

  /**
   * Hàng đợi tiền vào chưa biết của đơn nào. Không có route "mọi biến động":
   * tiền chuyển đi không phải việc của CMS, và sổ cái thô vẫn nằm nguyên trong
   * database cho lúc cần đối soát.
   */
  @Get('unmatched')
  findUnmatched(@Query() query: QueryUnmatchedDto) {
    return this.paymentsService.findUnmatched(query);
  }

  @Post('transactions/:id/match')
  match(
    @CurrentAdmin() actor: AdminUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MatchTransactionDto,
  ) {
    return this.paymentsService.matchManually(actor, id, dto.paymentCode);
  }
}
