/**
 * Loại thông báo hiện trong chuông. Danh sách này là **hợp đồng với frontend**:
 * mỗi loại ứng với một cách dựng câu chữ và một đường dẫn riêng ở
 * `components/shared/notification-bell.tsx`, nên thêm loại mới thì phải thêm cả
 * chuỗi dịch ở hai locale.
 *
 * Cố ý không có loại nào gửi email: thông báo chỉ nằm trong ứng dụng và chỉ
 * được nạp lúc đăng nhập hoặc tải lại trang.
 *
 * Cột `notifications.type` là enum của Postgres, nên thêm một giá trị vào đây
 * phải đi kèm migration `ALTER TYPE ... ADD VALUE`.
 */
export const NOTIFICATION_TYPES = [
  'wish_pending',
  'link_expiring',
  'link_expired',
  'payment_success',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Loại còn được **tạo và trả ra**. `link_expiring`/`link_expired` là di sản của
 * mô hình dùng thử 3 ngày (đã gỡ): Postgres không xoá được giá trị enum nên
 * chúng ở lại `NOTIFICATION_TYPES`, nhưng không code nào ghi chúng nữa và danh
 * sách chuông lọc chúng đi.
 */
export const ACTIVE_NOTIFICATION_TYPES = [
  'wish_pending',
  'payment_success',
] as const satisfies readonly NotificationType[];
