import { AuditModule } from '@modules/audit/audit.module';
import { CardsModule } from '@modules/cards/cards.module';
import { MailModule } from '@modules/mail/mail.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { StorageModule } from '@modules/storage/storage.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { AuditLogPurgeCron } from './audit-log-purge.cron';
import { UploadStagingPurgeCron } from './upload-staging-purge.cron';

/**
 * Việc chạy theo lịch.
 *
 * Gom vào một module riêng thay vì treo `@Cron` bên trong domain: một job là
 * **chỗ ghép nhiều domain lại** (`cards` + `notifications`), và đặt nó vào một
 * trong hai bên sẽ tạo ra một phụ thuộc mà bản thân domain đó không cần. Phụ
 * thuộc ở đây đi một chiều — `cronjob` biết các domain, không domain nào biết
 * `cronjob` — nên không có vòng nào để phá.
 *
 * `audit-log-purge` chỉ chạm đúng một domain, nhưng vẫn nằm đây: chỗ liệt kê
 * mọi việc chạy theo lịch phải là **một** chỗ, nếu không thì câu hỏi "đêm qua
 * cái gì đã xoá dữ liệu?" lại phải trả lời bằng cách grep cả repo.
 */
@Module({
  imports: [
    AuditModule,
    CardsModule,
    MailModule,
    NotificationsModule,
    StorageModule,
    UserModule,
  ],
  providers: [AuditLogPurgeCron, UploadStagingPurgeCron],
})
export class CronjobModule {}
