/**
 * Quyền tài khoản — bản sao của `backend/src/common/enums/user-role.enum.ts`.
 *
 * Dùng để **chọn giao diện**, không phải để cấp quyền: backend là nơi thực thi
 * (`CLAUDE.md` mục 6). Ẩn một mục nav chỉ khiến nó khó bấm nhầm, không khiến
 * route sau nó an toàn.
 *
 * Chỉ có quyền của khách: tài khoản quản trị nằm ở `admin_users` và đăng nhập ở
 * `dashboard/`, không bao giờ đi qua trang khách.
 */
export const USER_ROLES = ["customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" && (USER_ROLES as readonly string[]).includes(value)
  );
}
