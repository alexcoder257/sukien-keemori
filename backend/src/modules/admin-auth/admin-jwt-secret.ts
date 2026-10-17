import type { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

/**
 * Secret ký token CMS, **suy ra** từ secret của token khách bằng HMAC kèm nhãn
 * riêng.
 *
 * Phải khác secret khách: nếu hai loại dùng chung, access token của CMS cũng
 * qua được `JwtAuthGuard` như một "khách" có `sub` lạ, và ngược lại chỉ còn
 * claim `typ` đứng chắn. Suy ra thay vì thêm biến môi trường để production
 * không phải khai thêm gì — lộ secret gốc vẫn là lộ cả hai, nhưng đó đã là mức
 * rủi ro hiện có.
 */
export function adminJwtSecret(
  config: ConfigService,
  kind: 'access' | 'refresh',
): string {
  const base = config.get<string>(
    kind === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET',
  );
  if (!base) {
    throw new Error(`Thiếu JWT_${kind.toUpperCase()}_SECRET`);
  }
  return createHmac('sha256', base).update(`keemori-cms:${kind}`).digest('hex');
}
