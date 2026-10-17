import { AuditModule } from '@modules/audit/audit.module';
import { CommerceModule } from '@modules/commerce/commerce.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransaction } from './payment-transaction.entity';
import {
  PaymentsAdminController,
  PaymentsController,
  PaymentsPublicController,
  SepayWebhookController,
} from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

/**
 * Nối ngân hàng qua SePay.
 *
 * Phụ thuộc đi **một chiều**: `payments` biết `commerce`, `commerce` không biết
 * `payments`. Nhờ vậy đổi nhà cung cấp (PayOS) hay đổi cách nhận diện đơn (tài
 * khoản định danh) chỉ động vào module này, còn luật đơn hàng và nâng gói nằm
 * yên ở `commerce`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentTransaction]),
    CommerceModule,
    AuditModule,
  ],
  controllers: [
    SepayWebhookController,
    PaymentsPublicController,
    PaymentsController,
    PaymentsAdminController,
  ],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
