"use client";

import type { InvitationKind, InvitationStatus } from "@/constants/invitation";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { stripLegacyKeys } from "@/lib/legacy-content";
import { request } from "./http";

/**
 * Nội dung gửi lên backend — **không kèm `wishes`**.
 *
 * Lời chúc là bảng riêng của module `interactions` và có vòng đời duyệt riêng;
 * `InvitationContentDto` phía backend cố ý không khai trường đó, mà
 * `ValidationPipe` bật `forbidNonWhitelisted`, nên gửi kèm là ăn 400. Việc cắt
 * đặt ở đây chứ không phải ở hook: đây là ranh giới API, và mọi người gọi đều
 * phải cắt như nhau.
 */
export type CardContentInput = Omit<InvitationContent, "wishes">;

/** Thiệp như backend trả về ở các route của chủ thiệp. */
export interface Card {
  id: string;
  slug: string;
  title: string;
  templateSlug: string;
  /** `draft` hoặc `paid` ("đã xuất bản"); mọi giá trị khác `draft` là đã xuất bản. */
  status: InvitationStatus;
  /**
   * Đơn đang chờ thanh toán của thiệp, nếu có — để "Thanh toán" mở lại đúng màn
   * chuyển khoản thay vì tạo đơn mới.
   */
  pendingOrderId: string | null;
  viewCount: number;
  content: CardContentInput;
}

export interface CreateCardInput {
  templateSlug: string;
  title?: string;
  /** Loại thiệp — backend dựng nội dung rỗng đúng loại; thiếu là thiệp cưới. */
  kind?: InvitationKind;
}

export interface UpdateCardInput {
  title?: string;
  content: CardContentInput;
}

function stripWishes(content: InvitationContent): CardContentInput {
  // Rest-destructuring là cách bỏ một khoá mà TypeScript suy ra được kiểu còn
  // lại; `wishes` tồn tại chỉ để bị bỏ đi. `familySplit`/`viewSide` là dấu vết
  // của tính năng Song Hỷ đã gỡ: thiệp cũ vẫn có thể mang chúng trong
  // `content`, và không gửi lại để lượt lưu dọn chúng khỏi thiệp.
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    wishes,
    ...rest
  } = content;
  return stripLegacyKeys(rest);
}

/**
 * Tạo thiệp rỗng. Nội dung **không** truyền ở đây — backend dựng nội dung rỗng
 * của chính nó rồi mới nhận `PUT`, nhờ vậy chỉ có một định nghĩa "thiệp rỗng".
 */
export function createCard(input: CreateCardInput): Promise<Card> {
  return request<Card>("/cards", { method: "POST", body: input });
}

/** Lưu nội dung. `PUT` vì editor gửi nguyên khối `content`, không patch lẻ. */
export function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  return request<Card>(`/cards/${id}`, { method: "PUT", body: input });
}

/** Đổi mẫu — backend giữ nguyên nội dung, chỉ thay lớp trình bày. */
export function changeCardTemplate(
  id: string,
  templateSlug: string,
): Promise<Card> {
  return request<Card>(`/cards/${id}/template`, {
    method: "PATCH",
    body: { templateSlug },
  });
}

/**
 * Xuất bản thiệp. Thiệp **chưa thanh toán** bị backend từ chối với
 * `API_ERROR_CODES.paymentRequired`: link chỉ có sau khi đơn được trả (webhook,
 * xác nhận tay hoặc đơn 0 ₫ — `markPaid` xuất bản thiệp). Thiệp đã trả thì gọi
 * lại là vô hại. Editor không gọi hàm này trong luồng lưu: nó dựa vào `status`
 * của thiệp mà `updateCard` trả về.
 */
export function publishCard(id: string): Promise<Card> {
  return request<Card>(`/cards/${id}/publish`, { method: "POST" });
}

export function deleteCard(id: string): Promise<void> {
  return request<void>(`/cards/${id}`, { method: "DELETE" });
}

export { stripWishes };
