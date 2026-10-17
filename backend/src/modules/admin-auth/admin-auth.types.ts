import type { AdminPermission } from '@common/enums/admin-permission.enum';
import type { AdminRole } from '@common/enums/admin-role.enum';

/**
 * Phân biệt token CMS với token khách. Hai loại vốn đã ký bằng hai secret khác
 * nhau; claim này là lớp kiểm thứ hai, và là thứ dashboard đọc để biết mình
 * đang cầm đúng loại token.
 */
export const ADMIN_TOKEN_TYPE = 'cms';

/** Payload của access/refresh token CMS. */
export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  typ: typeof ADMIN_TOKEN_TYPE;
  /**
   * Chỉ để dashboard **chọn giao diện**. Backend không đọc claim này: quyền
   * luôn bung lại từ `role` lúc xác thực (`ADMIN_ROLE_PERMISSIONS`).
   */
  permissions: AdminPermission[];
}

/**
 * Người vận hành đang gọi một route quản trị — thứ `AdminJwtStrategy` gắn vào
 * `req.user`.
 *
 * Cùng hình dạng với `AuditActor` (`userId`/`email`/`role`) để truyền thẳng vào
 * `AuditService.record` mà không phải dịch. `userId` là id trong
 * `admin_users`, **không** phải trong `users`; `audit_logs.actor_id` cố ý
 * không có khoá ngoại nên vẫn nhận được giá trị này.
 */
export interface AdminUser {
  userId: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
}

export interface AdminAuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Giây — dashboard đặt `maxAge` cho cookie refresh token theo số này. */
  refreshExpiresIn: number;
}

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  permissions: AdminPermission[];
  lastLoginAt: Date | null;
}
