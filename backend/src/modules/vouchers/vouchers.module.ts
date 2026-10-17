import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherRedemption } from './voucher-redemption.entity';
import { Voucher } from './voucher.entity';
import { VouchersAdminController } from './vouchers.controller';
import {
  VoucherRedemptionRepository,
  VoucherRepository,
} from './vouchers.repository';
import { VouchersService } from './vouchers.service';

/**
 * Module này **không import module nào khác**, giống `notifications`: các domain
 * khác gọi vào `VouchersService`, không có chiều ngược lại. Nhờ vậy thêm một
 * loại điều kiện cho mã giảm giá không bao giờ sinh phụ thuộc vòng với
 * `commerce`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Voucher, VoucherRedemption])],
  controllers: [VouchersAdminController],
  providers: [VouchersService, VoucherRepository, VoucherRedemptionRepository],
  exports: [VouchersService],
})
export class VouchersModule {}
