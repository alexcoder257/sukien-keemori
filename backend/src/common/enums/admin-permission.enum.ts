/**
 * Quyền thao tác trong CMS. Tài khoản quản trị (bảng `admin_users`) mang một
 * vai trò, và vai trò bung ra danh sách quyền ở `admin-role.enum.ts`.
 *
 * Mỗi quyền ứng với **một màn** của CMS, không phải một endpoint: chia nhỏ hơn
 * thì người cấp quyền phải hiểu API mới cấp đúng được. Ngoại lệ có lý do:
 * `users:delete` tách khỏi `users:view` vì vô hiệu hoá tài khoản là thao tác
 * quyết định ai còn vào được hệ thống.
 *
 * Thêm một quyền là sửa ba chỗ: danh sách này, bản sao ở
 * `dashboard/constants/permission.ts`, và gán nó vào vai trò phù hợp trong
 * `ADMIN_ROLE_PERMISSIONS`.
 */
export const ADMIN_PERMISSIONS = [
  'dashboard:view',
  'users:view',
  'users:delete',
  'cards:manage',
  'payments:manage',
  'pricing:manage',
  'vouchers:manage',
  'content:manage',
  'reviews:manage',
  'templates:manage',
  'settings:manage',
  'analytics:view',
  'audit:view',
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export function isAdminPermission(value: unknown): value is AdminPermission {
  return (
    typeof value === 'string' &&
    (ADMIN_PERMISSIONS as readonly string[]).includes(value)
  );
}
