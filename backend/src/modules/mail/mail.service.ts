import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type {
  SendMailOptions as NodemailerOptions,
  Transporter,
} from 'nodemailer';
import { EMAIL_CID } from './templates/email-layout';
import { paymentSuccessTemplate } from './templates/payment-success.template';
import type { PaymentSuccessTemplateData } from './templates/payment-success.template';
import type { RenderedEmail } from './templates/rendered-email';
import { resetPasswordTemplate } from './templates/reset-password.template';

interface SendMailOptions extends RenderedEmail {
  to: string;
}

/**
 * Banner và logo trong khung email, **nhúng vào thư** (CID) thay vì trỏ URL.
 * Outlook và nhiều ứng dụng thư doanh nghiệp chặn ảnh từ máy chủ ngoài cho tới
 * khi người đọc bấm "tải ảnh", nên một email trỏ URL mở ra là hai ô vỡ ngay chỗ
 * nhận diện thương hiệu. Nhúng thì không phụ thuộc vào đó, cũng không phụ thuộc
 * frontend đã deploy ảnh hay chưa. Đổi lại mỗi thư nặng thêm ~20KB — ảnh vì vậy
 * được nén sẵn (banner 1200px JPEG, logo 160px PNG).
 *
 * Tệp nằm ở `assets/` cạnh file này; `nest-cli.json` chép chúng sang `dist/`.
 */
const BRAND_IMAGES = [
  { cid: EMAIL_CID.cover, filename: 'keemori-cover.jpg' },
  { cid: EMAIL_CID.avatar, filename: 'keemori-avatar.png' },
] as const;

/**
 * Tên người gửi hiện trong hộp thư. Cố định trong code chứ không lấy từ
 * `MAIL_FROM`: đây là quyết định thương hiệu, không phải cấu hình môi trường —
 * để ở `.env` thì mỗi server một tên, và tên cũ nằm quên trên production là thứ
 * khách thấy đầu tiên. `MAIL_FROM` chỉ còn quyết định **địa chỉ**; phần tên
 * trong đó (nếu có) bị bỏ qua.
 */
export const MAIL_SENDER_NAME = 'Keemori - Thiệp Cưới Online';

/**
 * Gửi email qua SMTP thuần (nodemailer) → đổi nhà cung cấp chỉ bằng biến môi
 * trường, không phải sửa code: Brevo, Resend, Gmail, Mailtrap... đều có SMTP.
 * Khi chưa cấu hình SMTP (dev), email được log ra console thay vì gửi thật.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly brandAttachments: NonNullable<
    NodemailerOptions['attachments']
  > = loadBrandAttachments(this.logger);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    if (!host || !user || !pass) {
      this.logger.warn(
        'Chưa cấu hình MAIL_HOST/MAIL_USER/MAIL_PASSWORD — email sẽ được log ra console thay vì gửi đi.',
      );
      return;
    }

    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      // Port 465 dùng SSL ngầm; 587/2525 dùng STARTTLS.
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendResetPasswordEmail(
    to: string,
    fullName: string,
    resetUrl: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const mail = resetPasswordTemplate(
      { fullName, resetUrl, expiresInMinutes },
      this.siteUrl(),
    );
    await this.send({ to, ...mail });
  }

  /**
   * Biên nhận sau khi thanh toán. Chuông trong ứng dụng đã báo "đã nhận tiền";
   * email này tồn tại vì hai lý do: người trả tiền luôn cần một biên nhận, và
   * hộp thư là nơi duy nhất cái link thiệp còn tìm lại được sau vài tháng.
   */
  async sendPaymentSuccessEmail(
    to: string,
    data: PaymentSuccessTemplateData,
  ): Promise<void> {
    await this.send({ to, ...paymentSuccessTemplate(data, this.siteUrl()) });
  }

  private siteUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  /** Không bao giờ ném lỗi; trả `false` khi không gửi được. */
  private async send(options: SendMailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.debug(
        `[DEV] Email tới ${options.to} — ${options.subject}\n${options.text}`,
      );
      return false;
    }

    const from = {
      name: MAIL_SENDER_NAME,
      address: senderAddress(
        this.configService.get<string>('MAIL_FROM') ??
          this.configService.get<string>('MAIL_USER') ??
          '',
      ),
    };

    try {
      await this.transporter.sendMail({
        from,
        ...options,
        attachments: this.brandAttachments,
      });
      return true;
    } catch (error) {
      // Không ném lỗi ra ngoài: người dùng không nên biết email tồn tại hay
      // không, và lỗi SMTP không nên làm hỏng luồng quên mật khẩu.
      this.logger.error(
        `Gửi email tới ${options.to} thất bại`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}

/** `"Tên" <a@b.c>` → `a@b.c`; chuỗi chỉ có địa chỉ thì giữ nguyên. */
export function senderAddress(mailFrom: string): string {
  const match = /<([^>]+)>/.exec(mailFrom);
  return (match ? match[1] : mailFrom).trim();
}

/**
 * Đọc ảnh thương hiệu một lần lúc khởi động. Thiếu tệp thì vẫn gửi thư — chữ
 * `alt` hiện thay ảnh — chứ không làm hỏng cả luồng quên mật khẩu vì một banner.
 */
function loadBrandAttachments(
  logger: Logger,
): NonNullable<NodemailerOptions['attachments']> {
  return BRAND_IMAGES.flatMap(({ cid, filename }) => {
    try {
      const content = readFileSync(join(__dirname, 'assets', filename));
      return [
        { cid, filename, content, contentDisposition: 'inline' as const },
      ];
    } catch (error) {
      logger.warn(`Không đọc được ảnh email ${filename}: ${String(error)}`);
      return [];
    }
  });
}
