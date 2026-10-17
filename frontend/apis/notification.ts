"use client";

import { request } from "./http";

/**
 * Loại thông báo — khớp `backend/src/common/enums/notification.enum.ts`.
 * Thêm loại mới ở backend thì phải thêm cả ở đây và ở chuỗi dịch, nếu không
 * chuông sẽ có dòng không biết dựng câu chữ.
 */
export type NotificationType = "wish_pending" | "payment_success";

export interface WishPendingPayload {
  cardId: string;
  cardSlug: string;
  cardTitle: string;
  /** Số lời chúc đã dồn vào thông báo này. */
  count: number;
  latestName: string;
}

export interface PaymentSuccessPayload {
  orderId: string;
  cardId: string;
  cardSlug: string;
  cardTitle: string;
}

/**
 * Union phân biệt bằng `type`, đúng như backend gửi. Khai rời từng nhánh thay
 * vì gộp mọi trường vào một interface: gộp lại thì `payload.count` trông như
 * luôn tồn tại, và dòng "link sắp hết hạn" sẽ hiện ra con số `undefined`.
 */
export type AppNotification = {
  id: string;
  /** Thời điểm sự kiện gần nhất của nhóm, không phải lúc tạo dòng. */
  lastEventAt: string;
  readAt: string | null;
} & (
  | { type: "wish_pending"; payload: WishPendingPayload }
  | { type: "payment_success"; payload: PaymentSuccessPayload }
);

/**
 * Backend chỉ còn tạo hai loại (`wish_pending`, `payment_success`) nhưng enum
 * của nó vẫn giữ giá trị cũ của thông báo hạn link. Lọc thêm ở đây để một dòng
 * loại lạ không bao giờ tới được `presentRow` — nó không có câu chữ nào để dựng.
 */
const KNOWN_TYPES: readonly string[] = ["wish_pending", "payment_success"];

export async function getNotifications(): Promise<AppNotification[]> {
  const all = await request<{ type: string }[]>("/notifications");
  return all.filter((item): item is AppNotification =>
    KNOWN_TYPES.includes(item.type),
  );
}

export function markNotificationRead(id: string): Promise<void> {
  return request<void>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead(): Promise<void> {
  return request<void>("/notifications/read-all", { method: "PATCH" });
}
