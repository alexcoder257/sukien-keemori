"use client";

import type { Rsvp } from "@/lib/schemas/invitation";
import { request } from "./http";

export interface SubmitRsvpInput {
  name: string;
  attending: boolean;
  partySize: number;
  /** Mã link mời riêng. Có thì phản hồi đứng tên khách đó và gửi lại là sửa. */
  guestToken?: string;
}

export interface RsvpReceipt {
  attending: boolean;
  partySize: number;
}

/**
 * Khách gửi xác nhận tham dự. `auth: false` cùng lý do với `createWish`: khách
 * không có tài khoản, và backend không đọc người gửi từ token.
 */
export function submitRsvp(
  slug: string,
  input: SubmitRsvpInput,
): Promise<RsvpReceipt> {
  return request<RsvpReceipt>(
    `/public/cards/${encodeURIComponent(slug)}/rsvps`,
    { method: "POST", body: input, auth: false },
  );
}

/** Toàn bộ phản hồi của một thiệp — chỉ chủ thiệp gọi. */
export function getCardRsvps(cardId: string): Promise<Rsvp[]> {
  return request<Rsvp[]>(`/cards/${cardId}/rsvps`);
}

export function deleteRsvp(cardId: string, rsvpId: string): Promise<void> {
  return request<void>(`/cards/${cardId}/rsvps/${rsvpId}`, {
    method: "DELETE",
  });
}
