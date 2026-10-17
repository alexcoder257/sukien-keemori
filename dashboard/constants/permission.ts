/**
 * Quyền thao tác trong CMS — bản sao có chủ đích của
 * `backend/src/common/enums/admin-permission.enum.ts`. Sửa một bên thì sửa nốt
 * bên kia.
 *
 * Dùng để **chọn giao diện** (ẩn mục nav, ẩn nút), không phải để cấp quyền:
 * backend kiểm lại bằng `@Permissions(...)` trên từng route.
 */
export const ADMIN_PERMISSIONS = [
  "dashboard:view",
  "users:view",
  "users:delete",
  "cards:manage",
  "content:manage",
  "reviews:manage",
  "templates:manage",
  "settings:manage",
  "payments:manage",
  "pricing:manage",
  "vouchers:manage",
  "analytics:view",
  "audit:view",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export function isAdminPermission(value: unknown): value is AdminPermission {
  return (
    typeof value === "string" &&
    (ADMIN_PERMISSIONS as readonly string[]).includes(value)
  );
}

/**
 * Vai trò của người vận hành — bản sao của
 * `backend/src/common/enums/admin-role.enum.ts`. Bảng vai trò → quyền chỉ sống
 * ở backend; token mang sẵn danh sách quyền đã bung.
 */
export const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "editor",
  "support",
  "accountant",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

/** Phiên CMS đọc từ access token — chỉ để dựng giao diện. */
export interface AdminSession {
  email: string;
  role: AdminRole | null;
  permissions: AdminPermission[];
}

export function hasPermission(
  session: AdminSession | null,
  permission: AdminPermission,
): boolean {
  return !!session?.permissions.includes(permission);
}
