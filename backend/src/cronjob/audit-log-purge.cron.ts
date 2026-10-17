import {
  AUDIT_LOG_RETENTION_MONTHS,
  AuditService,
} from '@modules/audit/audit.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * Xoá nhật ký thao tác quá hạn lưu trữ (24 tháng).
 *
 * Cùng loại với `card-purge.cron.ts`: dữ liệu biến mất mà không ai bấm nút, nên
 * nó ở file riêng để chỗ đọc log và chỗ tắt job khi có sự cố là một chỗ rõ
 * ràng. Khác một điểm quan trọng — `audit_logs` là **thứ duy nhất trong hệ
 * thống không ai xoá được bằng tay**, kể cả `super_admin`; job này là ngoại lệ
 * duy nhất, và nó xoá theo thời gian chứ không theo ý một người.
 *
 * Chạy **hàng tuần** chứ không hàng ngày: hạn tính bằng tháng nên sai số vài
 * ngày không đổi ý nghĩa của cam kết, mà mỗi lần chạy là một `DELETE` quét cả
 * bảng. Sáng Chủ nhật 4h — sau `expired-card-purge` (3h) để hai việc nặng
 * không giẫm lên nhau.
 *
 * Con số 24 tháng đã được công bố ở Chính sách bảo mật mục 13; đổi nó là đổi
 * văn bản pháp lý (xem `AUDIT_LOG_RETENTION_MONTHS`).
 */
@Injectable()
export class AuditLogPurgeCron {
  private readonly logger = new Logger(AuditLogPurgeCron.name);

  constructor(private readonly auditService: AuditService) {}

  @Cron('0 4 * * 0', {
    name: 'audit-log-purge',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async purgeExpiredLogs(): Promise<void> {
    try {
      const purged = await this.auditService.purgeExpired();
      if (purged === 0) return;

      this.logger.log(
        `Đã xoá ${purged} dòng nhật ký quá ${AUDIT_LOG_RETENTION_MONTHS} tháng`,
      );
    } catch (error) {
      // Kêu to: một job dọn nhật ký hỏng âm thầm nghĩa là chính sách lưu trữ
      // đã công bố và hành vi thật của hệ thống lệch nhau mà không ai biết.
      this.logger.error('Không dọn được nhật ký quá hạn', error);
    }
  }
}
