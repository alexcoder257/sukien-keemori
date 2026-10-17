import { Module } from '@nestjs/common';
import { AdminAlertsService } from './admin-alerts.service';

/**
 * Tin báo cho người vận hành (Telegram).
 *
 * Module này **không import module nào khác**, giống `notifications`: `auth` và
 * `commerce` gọi vào `AdminAlertsService` với dữ liệu thô, không có chiều ngược
 * lại — nên thêm một loại tin báo không bao giờ sinh phụ thuộc vòng.
 */
@Module({
  providers: [AdminAlertsService],
  exports: [AdminAlertsService],
})
export class AdminAlertsModule {}
