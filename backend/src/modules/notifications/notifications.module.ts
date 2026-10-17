import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

/**
 * Chuông thông báo trong ứng dụng.
 *
 * Module này **không import module nào khác**: các domain khác bắn sự kiện vào
 * đây qua `NotificationsService`, không có chiều ngược lại. Nhờ vậy thêm một
 * loại thông báo mới không bao giờ sinh phụ thuộc vòng.
 *
 * Chuẩn team: chỉ export service.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
