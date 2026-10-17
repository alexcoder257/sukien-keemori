import { Injectable, Logger } from '@nestjs/common';
import type {
  AuditAction,
  AuditTargetType,
} from '@common/enums/audit-action.enum';
import type { AuditLog } from './audit-log.entity';
import { AuditRepository, type AuditQuery } from './audit.repository';

/**
 * Nhật ký giữ **24 tháng** rồi tự xoá (job `audit-log-purge`).
 *
 * Con số này là một cam kết đã công bố — Chính sách bảo mật mục 13 — nên đổi
 * nó là đổi văn bản pháp lý, không phải chỉnh một hằng số. Nó nằm trong code
 * chứ không nằm ở `site_settings` đúng vì vậy: hai con số kia (link chưa thanh
 * toán) là cấu hình vận hành, còn con số này rút ngắn xuống là xoá mất bằng
 * chứng về chính người vận hành.
 *
 * Vì sao có hạn: mỗi dòng mang email và hành vi của một người thật. Giữ mãi là
 * giữ dữ liệu cá nhân không còn mục đích; 24 tháng đủ dài để tra lại một sự cố
 * của mùa cưới năm ngoái.
 */
export const AUDIT_LOG_RETENTION_MONTHS = 24;

/** Ai làm — lấy từ `@CurrentUser()`, chụp lại chứ không tra ngược về sau. */
export interface AuditActor {
  userId: string;
  email: string;
  role: string;
}

export interface RecordAuditInput {
  action: AuditAction;
  actor: AuditActor | null;
  targetType: AuditTargetType;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Nhật ký thao tác.
 *
 * Module này **không import module nào khác**, giống `notifications`,
 * và `legal` — các domain khác gọi vào `AuditService`, không có
 * chiều ngược lại. Nhờ vậy ghi nhật ký cho một domain mới không bao giờ sinh
 * phụ thuộc vòng, kể cả khi domain đó đã được `audit` nhắc tên trong enum.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  /**
   * Ghi một dòng. **Không bao giờ ném lỗi** — cùng luật với `LegalService.record`.
   *
   * Lý do ở đây gắt hơn hai chỗ kia: `record` được gọi ngay cạnh những thao tác
   * *không hoàn tác được* (xoá tài khoản, nâng gói vì tiền đã về). Để lỗi ghi
   * nhật ký nổi lên thì người dùng bấm "xoá tài khoản" sẽ nhận về một lỗi 500
   * trong khi tài khoản đã xoá xong — và lần thử lại sẽ báo "không tìm thấy".
   * Mất một dòng nhật ký là tệ; hỏng một thao tác đã thành công thì tệ hơn.
   *
   * Đổi lại, mọi thất bại phải **kêu to trong log ứng dụng**: một audit log âm
   * thầm ngừng ghi là thứ chỉ bị phát hiện vào đúng ngày cần tra nó.
   */
  async record(input: RecordAuditInput): Promise<void> {
    try {
      await this.auditRepository.create({
        action: input.action,
        actorId: input.actor?.userId ?? null,
        actorEmail: input.actor?.email ?? null,
        actorRole: input.actor?.role ?? null,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        targetLabel: input.targetLabel ?? null,
        metadata: input.metadata ?? {},
        ipAddress: input.ipAddress ?? null,
      });
    } catch (error) {
      this.logger.error(
        `Không ghi được audit log ${input.action} cho ${input.targetType}:${String(
          input.targetId,
        )}: ${String(error)}`,
      );
    }
  }

  findPage(query: AuditQuery): Promise<[AuditLog[], number]> {
    return this.auditRepository.findPage(query);
  }

  /**
   * Xoá nhật ký quá `AUDIT_LOG_RETENTION_MONTHS` tháng. Trả về số dòng đã xoá.
   *
   * Ngược hẳn với `record`: hàm này **được phép ném lỗi**, và phải ném. `record`
   * im lặng vì nó đứng cạnh một thao tác đã thành công của người dùng; còn ở
   * đây người gọi là một cron không có ai đang chờ, nên thứ đắt nhất là một lần
   * xoá hỏng trôi qua không ai biết.
   *
   * Không có đường xoá nào khác vào bảng này — kể cả `super_admin` cũng không
   * có route xoá. Đây là ngoại lệ duy nhất, và nó là **thời gian** chứ không
   * phải một người.
   */
  async purgeExpired(): Promise<number> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - AUDIT_LOG_RETENTION_MONTHS);

    return this.auditRepository.deleteOlderThan(cutoff);
  }
}
