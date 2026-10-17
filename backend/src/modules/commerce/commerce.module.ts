import { AdminAlertsModule } from '@modules/admin-alerts/admin-alerts.module';
import { LegalModule } from '@modules/legal/legal.module';
import { CardsModule } from '@modules/cards/cards.module';
import { PricingModule } from '@modules/pricing/pricing.module';
import { MailModule } from '@modules/mail/mail.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { UserModule } from '@modules/user/user.module';
import { VouchersModule } from '@modules/vouchers/vouchers.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CommerceAdminController,
  CommerceController,
} from './commerce.controller';
import { CommerceRepository } from './commerce.repository';
import { CommerceService } from './commerce.service';
import { Order } from './order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    PricingModule,
    CardsModule,
    // Báo cho chủ thiệp biết tiền đã về: một dòng trong chuông, một email biên
    // nhận. Phụ thuộc đi một chiều — `notifications` và `mail` không biết
    // `commerce` — nên không cần `forwardRef`.
    NotificationsModule,
    MailModule,
    UserModule,
    // Ghi sổ việc khách chấp thuận Chính sách thanh toán lúc đặt mua.
    LegalModule,
    // Mã giảm giá. Phụ thuộc một chiều như `notifications`: `vouchers` không
    // biết `commerce` tồn tại — nó nhận sẵn số tiền và chỉ trả lời "mã này trừ
    // được bao nhiêu".
    VouchersModule,
    // Tin Telegram cho người vận hành khi đơn đã trả tiền. Một chiều như trên.
    AdminAlertsModule,
  ],
  controllers: [CommerceController, CommerceAdminController],
  providers: [CommerceService, CommerceRepository],
  exports: [CommerceService],
})
export class CommerceModule {}
