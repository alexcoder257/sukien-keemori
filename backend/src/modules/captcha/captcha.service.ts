import { ERROR_MESSAGES } from '@constant/error-messages';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

interface RecaptchaVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

/**
 * Xác minh token Google reCAPTCHA v2 (checkbox "Tôi không phải robot").
 *
 * Khi chưa cấu hình RECAPTCHA_SECRET_KEY (dev), việc kiểm tra được bỏ qua.
 */
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly secretKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');

    if (!this.secretKey) {
      this.logger.warn(
        'Chưa cấu hình RECAPTCHA_SECRET_KEY — bỏ qua kiểm tra captcha (chỉ nên xảy ra ở dev).',
      );
    }
  }

  /** @param token token do frontend lấy từ widget reCAPTCHA v2 */
  async verify(token: string | undefined): Promise<void> {
    if (!this.secretKey) return;

    if (!token) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.CAPTCHA_FAILED);
    }

    let result: RecaptchaVerifyResponse;
    try {
      const response = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: this.secretKey, response: token }),
      });
      result = (await response.json()) as RecaptchaVerifyResponse;
    } catch (error) {
      // Không gọi được Google → chặn request thay vì cho qua âm thầm.
      this.logger.error(
        'Không gọi được API xác minh reCAPTCHA',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(ERROR_MESSAGES.AUTH.CAPTCHA_FAILED);
    }

    if (!result.success) {
      this.logger.warn(
        `reCAPTCHA thất bại — errors=${(result['error-codes'] ?? []).join(',')}`,
      );
      throw new BadRequestException(ERROR_MESSAGES.AUTH.CAPTCHA_FAILED);
    }
  }
}
