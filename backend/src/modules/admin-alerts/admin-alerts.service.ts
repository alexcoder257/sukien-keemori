import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TELEGRAM_API = 'https://api.telegram.org';
const SEND_TIMEOUT_MS = 10_000;

export type NewUserSource = 'register' | 'google' | 'facebook';

export interface NewUserAlert {
  email: string;
  fullName: string;
  phone?: string | null;
  source: NewUserSource;
}

export interface OrderPaidAlert {
  orderId: string;
  amount: number;
  listAmount: number;
  discountAmount: number;
  voucherCode: string | null;
  gatewayReference: string | null;
  userEmail: string | null;
  cardTitle: string;
  cardSlug: string;
}

/** Số tiền trong tin báo, ví dụ `899.000 ₫`. */
function formatAmount(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

interface TelegramTarget {
  token: string;
  chatId: string;
}

const SOURCE_LABELS: Record<NewUserSource, string> = {
  register: 'Email + mật khẩu',
  google: 'Google',
  facebook: 'Facebook',
};

/**
 * Báo cho **người vận hành** qua Telegram khi có tài khoản mới hoặc đơn đã
 * thanh toán (và các tin hệ thống khác như sự cố email). Khác hẳn `notifications` (chuông của khách) và `mail` (thư gửi khách):
 * người nhận ở đây là chủ sản phẩm, không phải người dùng.
 *
 * Mọi hàm là fire-and-forget và **không bao giờ ném lỗi**: chúng được gọi ngay
 * sau những thao tác đã chốt — tài khoản đã tạo. Để Telegram chậm hay sập làm
 * đăng ký treo là đổi một tin nhắn lấy một sự cố thật.
 *
 * Chưa cấu hình `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` thì im lặng bỏ qua, để
 * dev và CI chạy được mà không cần bot.
 *
 * Tin báo đi tới **hai** nơi: chat chính, và — nếu khai `TELEGRAM_EXTRA_CHAT_ID`
 * — một chat phụ, qua bot riêng (`TELEGRAM_EXTRA_BOT_TOKEN`) hoặc mượn bot
 * chính khi để trống token. Hai nơi gửi độc lập: chat phụ hỏng không chặn chat
 * chính. Trả lời lệnh của bot (`reply`) thì chỉ về chat chính — đó là cuộc hội
 * thoại với người gõ lệnh, không phải tin báo.
 */
@Injectable()
export class AdminAlertsService {
  private readonly logger = new Logger(AdminAlertsService.name);

  constructor(private readonly configService: ConfigService) {}

  newUser(alert: NewUserAlert): void {
    const lines = [
      '🎉 Tài khoản mới',
      `👤 ${alert.fullName || '(chưa có tên)'}`,
      `✉️ ${alert.email}`,
      alert.phone ? `📞 ${alert.phone}` : null,
      `🔑 ${SOURCE_LABELS[alert.source]}`,
    ];
    this.send(lines);
  }

  orderPaid(alert: OrderPaidAlert): void {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const hasDiscount =
      alert.discountAmount > 0 || alert.amount < alert.listAmount;
    const lines = [
      '💰 Đơn mới đã thanh toán',
      `💵 ${formatAmount(alert.amount)}${
        hasDiscount ? ` (gốc ${formatAmount(alert.listAmount)})` : ''
      }`,
      alert.voucherCode ? `🏷 Mã giảm giá: ${alert.voucherCode}` : null,
      `👤 ${alert.userEmail ?? '(không rõ)'}`,
      `💌 ${alert.cardTitle || '(chưa đặt tên thiệp)'}`,
      frontendUrl ? `🔗 ${frontendUrl}/vi/t/${alert.cardSlug}` : null,
      `🧾 ${alert.gatewayReference ?? 'xác nhận tay'} · ${alert.orderId.slice(0, 8)}`,
    ];
    this.send(lines);
  }

  /** Tin báo: gửi tới chat chính và chat phụ (nếu có). */
  send(lines: Array<string | null>): void {
    const text = lines.filter((line) => line !== null).join('\n');
    for (const target of this.alertTargets()) this.post(target, text);
  }

  /**
   * Trả lời lệnh của `telegram-bot`: chỉ về chat chính — bot chỉ nói chuyện
   * với đúng chat đó.
   */
  reply(lines: Array<string | null>): void {
    const main = this.mainTarget();
    if (main) this.post(main, lines.filter((line) => line !== null).join('\n'));
  }

  private mainTarget(): TelegramTarget | null {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
    return token && chatId ? { token, chatId } : null;
  }

  private alertTargets(): TelegramTarget[] {
    const main = this.mainTarget();
    const extraChatId = this.configService.get<string>(
      'TELEGRAM_EXTRA_CHAT_ID',
    );
    const extraToken =
      this.configService.get<string>('TELEGRAM_EXTRA_BOT_TOKEN') || main?.token;
    const targets = main ? [main] : [];
    if (extraChatId && extraToken) {
      targets.push({ token: extraToken, chatId: extraChatId });
    }
    return targets;
  }

  private post({ token, chatId }: TelegramTarget, text: string): void {
    // Plain text, không `parse_mode`: tên người dùng và tên thiệp là chữ khách
    // gõ, bật Markdown thì một dấu `_` lẻ làm Telegram từ chối cả tin.
    void fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })
      .then(async (response) => {
        if (!response.ok) {
          this.logger.warn(
            `Telegram từ chối tin nhắn: HTTP ${response.status} ${await response.text()}`,
          );
        }
      })
      .catch((error: unknown) => {
        this.logger.warn(`Không gửi được tin Telegram: ${String(error)}`);
      });
  }
}
