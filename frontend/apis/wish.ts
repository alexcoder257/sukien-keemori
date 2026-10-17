"use client";

import type { Wish } from "@/lib/schemas/invitation";
import { request } from "./http";

export interface CreateWishInput {
  name: string;
  message: string;
}

/**
 * Khách mời gửi lời chúc vào một thiệp đã xuất bản.
 *
 * `auth: false` vì đây là bề mặt ghi công khai duy nhất của hệ thống: khách mời
 * không có tài khoản, và gắn token của chủ thiệp đang đăng nhập trên cùng máy
 * cũng không đổi được gì — backend không đọc người gửi. Lời chúc luôn về ở
 * trạng thái **chờ duyệt**, nên nơi gọi không được chèn nó vào danh sách đang
 * hiện trên thiệp.
 */
export function createWish(
  slug: string,
  input: CreateWishInput,
): Promise<Wish> {
  return request<Wish>(
    `/public/cards/${encodeURIComponent(slug)}/wishes`,
    { method: "POST", body: input, auth: false },
  );
}

/** Toàn bộ lời chúc của một thiệp, gồm cả bản chờ duyệt — chỉ chủ thiệp gọi. */
/** Số lời chúc đang chờ duyệt của mỗi thiệp, khoá theo id thiệp. */
export function getPendingWishCounts(): Promise<Record<string, number>> {
  return request("/wishes/pending-count", { method: "GET" });
}

export function getCardWishes(cardId: string): Promise<Wish[]> {
  return request<Wish[]>(`/cards/${cardId}/wishes`);
}

/** Duyệt hoặc ẩn lại một lời chúc. Quyền sở hữu do backend kiểm. */
export function setWishApproved(
  cardId: string,
  wishId: string,
  approved: boolean,
): Promise<Wish> {
  return request<Wish>(`/cards/${cardId}/wishes/${wishId}/approve`, {
    method: "PATCH",
    body: { approved },
  });
}

export function deleteWish(cardId: string, wishId: string): Promise<void> {
  return request<void>(`/cards/${cardId}/wishes/${wishId}`, {
    method: "DELETE",
  });
}
