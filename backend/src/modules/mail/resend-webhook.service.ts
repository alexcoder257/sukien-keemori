import { AdminAlertsService } from '@modules/admin-alerts/admin-alerts.service';
import { Injectable, Logger } from '@nestjs/common';

/** Độ dài tối đa của một trường lấy từ thư; header `From` do người lạ gõ. */
const MAX_FIELD_LENGTH = 200;

/** Phần của một sự kiện webhook Resend mà backend cần đọc. */
export interface ResendWebhookEvent {
  type?: string;
  data?: {
    from?: string;
    to?: string[] | string;
    subject?: string;
    bounce?: { message?: string };
    failed?: { reason?: string };
  };
}

/**
 * Chuyển sự kiện webhook của Resend thành tin Telegram cho người vận hành.
 *
 * Hai nhóm sự kiện:
 * - `email.received` — có người gửi thư tới `@keemori.com` (MX của domain trỏ
 *   về Resend). Tin chỉ báo **ai gửi, gửi tới địa chỉ nào**, cố ý không kèm
 *   tiêu đề hay nội dung: người vận hành vào Resend để đọc, còn Telegram không
 *   thành bản sao thứ hai của hộp thư.
 * - Thư **đi** không tới được khách (`bounced`, `complained`, `failed`,
 *   `delivery_delayed`) — cách duy nhất biết thư đặt lại mật khẩu hay biên nhận
 *   thanh toán rơi mất. `sent`/`delivered` bị bỏ qua: mỗi thư một tin là nhiễu.
 *
 * Chọn sự kiện nào được bắn là việc của màn Webhooks trên Resend; loại lạ tới
 * đây thì im lặng bỏ qua. `handle` **không bao giờ ném lỗi**: webhook trả khác
 * 2xx là Svix gửi lại, và một payload lệch định dạng sẽ lặp mãi.
 */
@Injectable()
export class ResendWebhookService {
  private readonly logger = new Logger(ResendWebhookService.name);

  constructor(private readonly adminAlertsService: AdminAlertsService) {}

  handle(event: ResendWebhookEvent): void {
    try {
      const lines = formatResendEvent(event);
      if (lines) this.adminAlertsService.send(lines);
    } catch (error) {
      this.logger.error(`Không xử lý được webhook Resend: ${String(error)}`);
    }
  }
}

export function formatResendEvent(
  event: ResendWebhookEvent,
): Array<string | null> | null {
  const data = event.data ?? {};
  const to = clip(
    (Array.isArray(data.to) ? data.to : [data.to]).filter(Boolean).join(', '),
  );
  const subject = data.subject ? `📝 ${clip(data.subject)}` : null;

  switch (event.type) {
    case 'email.received':
      return [
        '📨 Thư mới',
        `👤 ${clip(data.from) || '(không rõ người gửi)'}`,
        to ? `📥 Gửi tới ${to}` : null,
      ];
    case 'email.bounced':
      return [
        '⚠️ Thư bị trả về (bounce)',
        `👤 ${to || '(không rõ)'}`,
        subject,
        data.bounce?.message ? `💬 ${clip(data.bounce.message)}` : null,
      ];
    case 'email.complained':
      return [
        '🚫 Người nhận đánh dấu thư là spam',
        `👤 ${to || '(không rõ)'}`,
        subject,
      ];
    case 'email.failed':
      return [
        '❌ Resend không gửi được thư',
        `👤 ${to || '(không rõ)'}`,
        subject,
        data.failed?.reason ? `💬 ${clip(data.failed.reason)}` : null,
      ];
    case 'email.delivery_delayed':
      return ['⏳ Thư đang bị chậm', `👤 ${to || '(không rõ)'}`, subject];
    default:
      return null;
  }
}

function clip(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > MAX_FIELD_LENGTH
    ? `${trimmed.slice(0, MAX_FIELD_LENGTH)}…`
    : trimmed;
}
