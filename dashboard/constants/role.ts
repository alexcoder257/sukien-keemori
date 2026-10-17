/**
 * Quyền tài khoản **khách** — bản sao của
 * `backend/src/common/enums/user-role.enum.ts`.
 *
 * CMS chỉ đọc giá trị này để hiển thị bảng Người dùng. Quyền của chính người
 * vận hành không nằm ở đây mà ở bảng `admin_users` — xem
 * `constants/permission.ts`.
 */
export const USER_ROLES = ["customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];
