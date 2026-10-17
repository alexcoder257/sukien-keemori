"use client";

import type { ShowcaseKind } from "@/constants/showcase";
import type { Paged, PageInput } from "./pagination";
import { pageQuery } from "./pagination";
import { request } from "./http";

/* -------------------------------------------------------------------- FAQ */

export interface Faq {
  id: string;
  questionVi: string;
  answerVi: string;
  questionEn: string;
  answerEn: string;
  sortOrder: number;
  isPublished: boolean;
}

export type FaqInput = Omit<Faq, "id">;

/**
 * Nhánh admin trả **bản ghi thô**: cả FAQ đang tắt và cả hai ngôn ngữ. Route
 * công khai `/faqs` thì chỉ trả cột của một ngôn ngữ, nên hai bên không dùng
 * chung kiểu được.
 */
export function getFaqs(page: PageInput = {}): Promise<Paged<Faq>> {
  return request<Paged<Faq>>(`/admin/faqs${pageQuery(page)}`);
}

export function createFaq(input: FaqInput): Promise<Faq> {
  return request<Faq>("/admin/faqs", { method: "POST", body: input });
}

export function updateFaq(id: string, input: Partial<FaqInput>): Promise<Faq> {
  return request<Faq>(`/admin/faqs/${id}`, { method: "PATCH", body: input });
}

export function deleteFaq(id: string): Promise<void> {
  return request<void>(`/admin/faqs/${id}`, { method: "DELETE" });
}

/* --------------------------------------------------- couple showcase (home) */

/**
 * Một ô trong dải "Cặp đôi đã tạo thiệp" ở trang chủ.
 *
 * `slug` là slug của một thiệp có thật — ô trong dải là link `/t/<slug>`, và
 * phụ đề ngay cạnh nói "thiệp thật, do các cặp đôi tự tạo trên nền tảng". Bảng
 * này chỉ giữ phần *trưng bày*; nội dung thiệp vẫn nằm ở `wedding_cards`.
 */
export interface CoupleShowcase {
  id: string;
  slug: string;
  /** `slug` là của một thiệp (`/t/…`) hay của một mẫu (`/mau-thiep/…/demo`). */
  kind: ShowcaseKind;
  names: string;
  /** Nhãn hiển thị (`22/11/2026`), không phải mốc để tính toán. */
  weddingDate: string;
  /** Ảnh chụp dài toàn bộ thiệp — card pan nó khi hover. */
  imageSrc: string;
  /** Ảnh bìa của card; `null` thì trang khách suy từ `imageSrc`. */
  posterSrc: string | null;
  imagePosition: string;
  sortOrder: number;
  isPublished: boolean;
}

export type CoupleShowcaseInput = Omit<CoupleShowcase, "id">;

export function getCoupleShowcases(
  page: PageInput = {},
): Promise<Paged<CoupleShowcase>> {
  return request<Paged<CoupleShowcase>>(
    `/admin/couple-showcases${pageQuery(page)}`,
  );
}

export function createCoupleShowcase(
  input: CoupleShowcaseInput,
): Promise<CoupleShowcase> {
  return request<CoupleShowcase>("/admin/couple-showcases", {
    method: "POST",
    body: input,
  });
}

export function updateCoupleShowcase(
  id: string,
  input: Partial<CoupleShowcaseInput>,
): Promise<CoupleShowcase> {
  return request<CoupleShowcase>(`/admin/couple-showcases/${id}`, {
    method: "PATCH",
    body: input,
  });
}

/** `ids` là **cả dải** theo thứ tự mới; thiếu hay thừa một ô thì backend từ chối. */
export function reorderCoupleShowcases(ids: string[]): Promise<void> {
  return request<void>("/admin/couple-showcases/order", {
    method: "PUT",
    body: { ids },
  });
}

export function deleteCoupleShowcase(id: string): Promise<void> {
  return request<void>(`/admin/couple-showcases/${id}`, { method: "DELETE" });
}

/* -------------------------------------------------------------- site stats */

/**
 * Dải số liệu ở trang chủ.
 *
 * Đây là **con số marketing do người vận hành chốt**, không phải `COUNT(*)`
 * trên dữ liệu thật — xem `SiteStat` ở backend. Khoá cố định nên chỉ có đọc và
 * sửa, không thêm/xoá.
 */
export const SITE_STAT_KEYS = [
  "home.invitations",
  "home.templates",
  "home.rating",
] as const;

export type SiteStatKey = (typeof SITE_STAT_KEYS)[number];

export interface SiteStat {
  key: SiteStatKey;
  value: number;
}

export function getSiteStats(): Promise<SiteStat[]> {
  return request<SiteStat[]>("/admin/site-stats");
}

export function updateSiteStats(stats: SiteStat[]): Promise<SiteStat[]> {
  return request<SiteStat[]>("/admin/site-stats", {
    method: "PATCH",
    body: { stats },
  });
}
