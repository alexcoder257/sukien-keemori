import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

/**
 * Xác thực webhook Telegram bằng `secret_token` đã khai lúc `setWebhook`:
 * Telegram gửi lại đúng chuỗi đó trong header `X-Telegram-Bot-Api-Secret-Token`.
 *
 * Chưa cấu hình secret thì **từ chối**, vì
 * route này trả số liệu vận hành, mở toang thì ai biết URL cũng giả được một
 * update từ đúng chat id của người vận hành.
 */
@Injectable()
export class TelegramWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (!expected) {
      throw new ServiceUnavailableException(
        ERROR_MESSAGES.TELEGRAM.WEBHOOK_NOT_CONFIGURED,
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const presented = request.headers[SECRET_HEADER];
    if (typeof presented !== 'string' || !safeEqual(presented, expected)) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.TELEGRAM.WEBHOOK_FORBIDDEN,
      );
    }
    return true;
  }
}

/** So sánh không phụ thuộc thời gian — tránh lộ độ dài chuỗi khớp qua thời gian phản hồi. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
