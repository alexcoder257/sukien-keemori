import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { timingSafeEqual } from 'crypto';
// TẠM THỜI — đi cùng khối log chẩn đoán bên dưới.
import { appendFileSync } from 'fs';
import type { Request } from 'express';

/**
 * Xác thực webhook của SePay bằng API key.
 *
 * SePay gửi header `Authorization: Apikey <key>` (định dạng của họ, không phải
 * `Bearer`). Đây là **route công khai duy nhất có thể nâng gói cho thiệp**, nên
 * nó không dùng `JwtAuthGuard` mà tự gác bằng key dùng chung.
 *
 * Chưa cấu hình key thì **từ chối**, không phải cho qua. Một webhook không xác
 * thực nghĩa là bất kỳ ai biết URL cũng tự nâng gói Diamond cho mình được —
 * hỏng kiểu mở toang thì tệ hơn hẳn hỏng kiểu đóng chặt.
 */
@Injectable()
export class SepayWebhookGuard implements CanActivate {
  private readonly logger = new Logger(SepayWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('SEPAY_WEBHOOK_API_KEY');
    if (!expected) {
      throw new ServiceUnavailableException(
        ERROR_MESSAGES.PAYMENT.WEBHOOK_NOT_CONFIGURED,
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const presented = header?.replace(/^Apikey\s+/i, '').trim();
    if (!presented || !safeEqual(presented, expected)) {
      // TẠM THỜI — gỡ sau khi chốt xong cấu hình webhook. Không ghi key ra
      // log: chỉ đủ để phân biệt "sai key" với "sai định dạng header".
      const diagnostic = `Webhook bị từ chối. Header: ${
        header ? `"${header.split(' ')[0]}" (dài ${header.length})` : 'không có'
      }; key gửi lên dài ${presented?.length ?? 0}, key cấu hình dài ${
        expected.length
      }; 6 ký tự đầu ${
        presented?.slice(0, 6) === expected.slice(0, 6) ? 'khớp' : 'khác'
      }. Các header khác: ${Object.keys(request.headers).join(', ')}`;
      this.logger.warn(diagnostic);
      appendFileSync(
        '/tmp/sepay-auth-debug.log',
        `${new Date().toISOString()} ${diagnostic}\n`,
      );
      throw new UnauthorizedException(ERROR_MESSAGES.PAYMENT.WEBHOOK_FORBIDDEN);
    }
    return true;
  }
}

/**
 * So sánh không phụ thuộc thời gian. `===` trên chuỗi thoát ra ngay ký tự đầu
 * khác nhau, đủ để dò dần từng ký tự của key qua thời gian phản hồi.
 */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  // `timingSafeEqual` ném lỗi khi hai buffer khác độ dài, mà độ dài thì không
  // phải bí mật — kiểm trước rồi mới so nội dung.
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
