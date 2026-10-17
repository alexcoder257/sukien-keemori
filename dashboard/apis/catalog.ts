"use client";

import type { Tier } from "@/constants/tier";
import type {
  TemplateCategory,
  TemplateColor,
  TemplateTag,
} from "@/constants/template";
import { pageQuery, type PageInput, type Paged } from "./pagination";
import { request } from "./http";

export interface Template {
  id: string;
  slug: string;
  name: string;
  tier: Tier;
  categories: TemplateCategory[];
  /** Chỉ đọc — backend không nhận cột này khi cập nhật. */
  colorTones: TemplateColor[];
  tags: TemplateTag[];
  photoSlots: string[];
  imagePosition: string;
  imageSrc: string | null;
  isPublished: boolean;
  sortOrder: number;
  featuredOnHome: boolean;
  homepageOrder: number;
}

/**
 * Kho mẫu cho khu quản trị, gồm cả mẫu chưa xuất bản.
 *
 * Không truyền `page` là lấy hết — ô chọn thiệp và form "mẫu trên trang chủ"
 * cần cả kho trong một lượt để chọn và sắp thứ tự; chỉ bảng tag mẫu mới lật
 * từng trang.
 */
export interface QueryTemplatesInput extends PageInput {
  /** Tìm theo tên hoặc đường dẫn mẫu. */
  q?: string;
  tier?: Tier;
}

export function getTemplates(
  input: QueryTemplatesInput = {},
): Promise<Paged<Template>> {
  const params = new URLSearchParams(pageQuery(input).replace(/^\?/, ""));
  if (input.q) params.set("q", input.q);
  if (input.tier) params.set("tier", input.tier);
  const query = params.toString();
  return request<Paged<Template>>(
    `/admin/templates${query ? `?${query}` : ""}`,
  );
}

/**
 * Sửa metadata của mẫu. `slug` không đổi được — nó là khoá nối tới component và
 * thư mục ảnh phía trang khách, backend cũng không nhận trường này.
 */
export function updateTemplate(
  slug: string,
  input: Partial<
    Pick<
      Template,
      | "name"
      | "tier"
      | "categories"
      | "tags"
      | "isPublished"
      | "sortOrder"
      | "featuredOnHome"
      | "homepageOrder"
    >
  >,
): Promise<Template> {
  return request<Template>(`/admin/templates/${slug}`, {
    method: "PATCH",
    body: input,
  });
}

/**
 * Đặt lại **cả dải** mẫu trang chủ theo thứ tự gửi lên. Một lần gọi cho cả danh
 * sách: gửi từng mẫu một thì giữa chừng trang chủ hiện sai thứ tự.
 */
export function setHomepageTemplates(slugs: string[]): Promise<Template[]> {
  return request<Template[]>("/admin/homepage-templates", {
    method: "PUT",
    body: { slugs },
  });
}

/* ---------------------------------------------------------------- bảng giá */

/** Kỳ thống kê của màn "Mẫu xem nhiều"; `0` là từ trước tới nay. */
export const TEMPLATE_STATS_DAYS = [7, 30, 90, 0] as const;
export type TemplateStatsDays = (typeof TEMPLATE_STATS_DAYS)[number];

export interface TemplateStatsRow {
  slug: string;
  name: string;
  tier: Tier;
  imageSrc: string | null;
  isPublished: boolean;
  /** Lượt mở xem mẫu (hộp thoại hoặc trang mẫu), mỗi trình duyệt một lần/ngày. */
  openViews: number;
  /** Lượt mở bản demo đầy đủ. */
  demoViews: number;
  /** Thiệp khách tạo từ mẫu này trong cùng kỳ. */
  cardsCreated: number;
}

export interface TemplateStats {
  items: TemplateStatsRow[];
  /** Ngày đầu có số liệu xem mẫu (`YYYY-MM-DD`); `null` là chưa có lượt nào. */
  trackingSince: string | null;
}

export function getTemplateStats(
  days: TemplateStatsDays,
): Promise<TemplateStats> {
  return request<TemplateStats>(`/admin/template-stats?days=${days}`);
}
