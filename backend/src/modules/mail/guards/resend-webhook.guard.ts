import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

/** Svix mặc định chấp nhận lệch 5 phút; quá mức đó coi như bị phát lại. */
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

/**
 * Xác thực webhook Resend. Resend ký bằng **Svix**: HMAC-SHA256 trên chuỗi
 * `<svix-id>.<svix-timestamp>.<raw body>`, khoá là phần base64 sau `whsec_`
 * của signing secret, kết quả nằm trong header `svix-signature` dạng
 * `v1,<base64>` (có thể nhiều chữ ký cách nhau bằng dấu cách khi đang xoay
 * secret).
 *
 * Tự viết thay vì thêm gói `svix`: chỉ là một phép HMAC, không đáng một
 * dependency mới. Ký trên **raw body**, nên `main.ts` phải bật `rawBody` —
 * `JSON.stringify` lại body đã parse không ra đúng từng byte Resend đã ký.
 *
 * Chưa cấu hình secret thì **từ chối**, cùng lý do với `TelegramWebhookGuard`:
 * mở toang thì ai biết URL cũng bắn được tin giả vào Telegram của người vận hành.
 */
@Injectable()
export class ResendWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('RESEND_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException(
        ERROR_MESSAGES.RESEND.WEBHOOK_NOT_CONFIGURED,
      );
    }

    const request = context
      .switchToHttp()
      .getRequest<RawBodyRequest<Request>>();
    const valid = verifySvixSignature({
      secret,
      id: request.headers['svix-id'],
      timestamp: request.headers['svix-timestamp'],
      signature: request.headers['svix-signature'],
      rawBody: request.rawBody,
      nowSeconds: Math.floor(Date.now() / 1000),
    });
    if (!valid) {
      throw new UnauthorizedException(ERROR_MESSAGES.RESEND.WEBHOOK_FORBIDDEN);
    }
    return true;
  }
}

interface SvixSignatureInput {
  secret: string;
  id: string | string[] | undefined;
  timestamp: string | string[] | undefined;
  signature: string | string[] | undefined;
  rawBody: Buffer | undefined;
  nowSeconds: number;
}

export function verifySvixSignature(input: SvixSignatureInput): boolean {
  const { id, timestamp, signature, rawBody } = input;
  if (
    typeof id !== 'string' ||
    typeof timestamp !== 'string' ||
    typeof signature !== 'string' ||
    !rawBody
  ) {
    return false;
  }

  const sentAt = Number(timestamp);
  if (
    !Number.isFinite(sentAt) ||
    Math.abs(input.nowSeconds - sentAt) > TIMESTAMP_TOLERANCE_SECONDS
  ) {
    return false;
  }

  const key = Buffer.from(input.secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.`)
    .update(rawBody)
    .digest('base64');

  return signature
    .split(' ')
    .map((entry) => entry.split(','))
    .some(
      ([version, value]) =>
        version === 'v1' && value !== undefined && safeEqual(value, expected),
    );
}

/** So sánh không phụ thuộc thời gian — tránh lộ độ dài chuỗi khớp qua thời gian phản hồi. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
