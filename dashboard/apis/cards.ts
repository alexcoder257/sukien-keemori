"use client";

import type { InvitationKind } from "@/constants/invitation-kind";
import type { CardStatus } from "@/constants/template";
import type { UserRole } from "@/constants/role";
import type { Tier } from "@/constants/tier";
import { request } from "./http";

/**
 * Một dòng trong bảng "thiệp đã tạo". **Không có `content`**: khu quản trị cần
 * biết thiệp nào tồn tại và ở trạng thái nào, không cần đọc nội dung riêng tư
 * của từng cặp đôi — backend cũng không trả trường đó về.
 */
export interface AdminCard {
  id: string;
  slug: string;
  title: string;
  templateSlug: string;
  templateTier: Tier;
  status: CardStatus;
  viewCount: number;
  showcasedOnHome: boolean;
  publishedAt: string | null;
  /** Lần thanh toán đầu — tên cô dâu chú rể tự khoá 15 ngày sau mốc này. */
  paidAt: string | null;
  /** Admin đã mở khoá sửa tên cho thiệp này. */
  coupleNamesUnlocked: boolean;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    phone: string | null;
  };
  /**
   * `content.countdown.weddingDate` nguyên văn — trường duy nhất của `content`
   * backend trả ra, để ô trưng bày trang chủ điền sẵn ngày cưới.
   */
  weddingDate: string | null;
  /** `content.kind`; backend đã quy thiệp cũ không mang khoá về `wedding`. */
  kind: InvitationKind;
}

export interface AdminCardList {
  items: AdminCard[];
  total: number;
}

export interface QueryCardsInput {
  status?: CardStatus;
  templateSlug?: string;
  kind?: InvitationKind;
  q?: string;
  limit?: number;
  offset?: number;
}

export function getAdminCards(
  input: QueryCardsInput = {},
): Promise<AdminCardList> {
  const params = new URLSearchParams();
  if (input.status) params.set("status", input.status);
  if (input.templateSlug) params.set("templateSlug", input.templateSlug);
  if (input.kind) params.set("kind", input.kind);
  if (input.q) params.set("q", input.q);
  if (input.limit !== undefined) params.set("limit", String(input.limit));
  if (input.offset !== undefined) params.set("offset", String(input.offset));
  const query = params.toString();
  return request<AdminCardList>(`/admin/cards${query ? `?${query}` : ""}`);
}

function pageParams(input: { limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (input.limit !== undefined) params.set("limit", String(input.limit));
  if (input.offset !== undefined) params.set("offset", String(input.offset));
  return params;
}

export const WEDDING_SCOPES = ["upcoming", "past"] as const;
export type WeddingScope = (typeof WEDDING_SCOPES)[number];

/** Thiệp xếp theo ngày cưới: sắp tới thì gần nhất trước, đã qua thì vừa xong trước. */
export function getWeddings(input: {
  scope: WeddingScope;
  /** Chỉ trong chừng ấy ngày tính từ hôm nay; bỏ trống là không giới hạn. */
  withinDays?: number;
  limit?: number;
  offset?: number;
}): Promise<AdminCardList> {
  const params = pageParams(input);
  params.set("scope", input.scope);
  if (input.withinDays) params.set("withinDays", String(input.withinDays));
  return request(`/admin/cards/weddings?${params.toString()}`);
}

/** Bật/tắt trưng bày thiệp thật ở trang chủ. Thiệp nháp thì backend từ chối. */
export function setCardShowcase(
  id: string,
  showcasedOnHome: boolean,
): Promise<AdminCard> {
  return request<AdminCard>(`/admin/cards/${id}/showcase`, {
    method: "PATCH",
    body: { showcasedOnHome },
  });
}

/**
 * Mở (`true`) hoặc khoá lại (`false`) việc sửa tên cô dâu chú rể. Chỉ thiệp đã
 * thanh toán; backend ghi nhật ký cho mỗi lần đổi.
 */
export function setCardCoupleNamesLock(
  id: string,
  unlocked: boolean,
): Promise<{ id: string; coupleNamesUnlocked: boolean }> {
  return request(`/admin/cards/${id}/couple-names-lock`, {
    method: "PATCH",
    body: { unlocked },
  });
}
