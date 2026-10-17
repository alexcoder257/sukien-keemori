/**
 * Quyền của tài khoản **khách** (bảng `users`).
 * - `customer`: khách B2C, trả tiền theo giá cố định.
 *
 * `partner` (khách B2B) đã bị gỡ cùng tính năng đối tác; migration
 * `RemovePartnersAndBlog` đưa mọi tài khoản đó về `customer` và dựng lại enum
 * Postgres không còn giá trị này.
 *
 * Không có quyền quản trị ở đây: người vận hành CMS nằm ở bảng riêng
 * `admin_users` (`modules/admin-auth/`). Hai giá trị `admin` và `super_admin`
 * từng nằm trong enum này đã bị gỡ ở migration `MoveAdminsToKeycloak` — một
 * tài khoản khách không bao giờ mở được CMS.
 */
export const USER_ROLES = ['customer'] as const;
export type UserRole = (typeof USER_ROLES)[number];
