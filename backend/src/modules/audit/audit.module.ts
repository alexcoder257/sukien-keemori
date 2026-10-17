import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditController } from './audit.controller';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

/**
 * Nhật ký thao tác.
 *
 * **Không `imports` gì cả** — cùng khuôn `notifications` và `legal`. Các domain khác import `AuditModule` để gọi `AuditService`; chiều
 * ngược lại không tồn tại, nên thêm nhật ký cho một domain mới không bao giờ
 * sinh phụ thuộc vòng.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}
