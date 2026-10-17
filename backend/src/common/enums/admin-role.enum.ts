import type { AdminPermission } from './admin-permission.enum';
import { ADMIN_PERMISSIONS } from './admin-permission.enum';

/**
 * Vai trò của người vận hành CMS (bảng `admin_users`). Mỗi tài khoản mang
 * **một** vai trò; quyền được bung từ bảng dưới đây lúc xác thực token, nên đổi
 * bảng này có hiệu lực ngay ở request kế tiếp mà không phải đăng nhập lại.
 *
 * Năm vai trò chép nguyên từ các role tổ hợp `cms-*` của realm Keycloak cũ, để
 * người vận hành thấy đúng bộ màn như trước.
 *
 * Thêm vai trò là sửa ba chỗ: danh sách này, `ADMIN_ROLE_PERMISSIONS` và một
 * migration `ALTER TYPE admin_users_role_enum ADD VALUE`.
 */
export const ADMIN_ROLES = [
  'super_admin',
  'admin',
  'editor',
  'support',
  'accountant',
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_PERMISSIONS: Record<
  AdminRole,
  readonly AdminPermission[]
> = {
  super_admin: ADMIN_PERMISSIONS,
  admin: [
    'dashboard:view',
    'users:view',
    'cards:manage',
    'payments:manage',
    'content:manage',
    'reviews:manage',
    'templates:manage',
    'settings:manage',
  ],
  editor: [
    'dashboard:view',
    'content:manage',
    'reviews:manage',
    'templates:manage',
  ],
  support: ['dashboard:view', 'users:view', 'cards:manage', 'payments:manage'],
  // Kế toán: tiền vào, bảng giá và mã giảm giá — không có màn doanh thu/chi phí
  // (đã gỡ cùng quyền `revenue:manage`).
  accountant: [
    'dashboard:view',
    'payments:manage',
    'pricing:manage',
    'vouchers:manage',
    'analytics:view',
  ],
};

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === 'string' &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}
