import { ConfigService } from '@nestjs/config';

/**
 * Bật/tắt toàn bộ rate limit (throttler theo IP + hạn mức gửi mail theo email).
 * Mặc định BẬT — phải khai báo `RATE_LIMIT_ENABLED=false` một cách tường minh
 * mới tắt, để không bao giờ vô tình tắt ở production.
 */
export const isRateLimitEnabled = (configService: ConfigService): boolean =>
  configService.get<string>('RATE_LIMIT_ENABLED') !== 'false';
