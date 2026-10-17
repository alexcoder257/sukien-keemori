import { z } from "zod";
import type { SiteStatKey } from "@/apis/content";
import type { AdminErrors } from "./store";

/**
 * Tên ô trong form, **không phải** khoá gửi lên backend.
 *
 * React Hook Form đọc dấu chấm trong tên field là **đường dẫn lồng nhau**, nên
 * `register("home.rating")` ghi giá trị vào `{ home: { rating } }` chứ không
 * phải một khoá phẳng — schema không khớp, `errors["home.rating"]` luôn rỗng, và
 * biểu hiện ra ngoài là bấm Lưu thì con trỏ nhảy vào ô lỗi mà không có dòng báo
 * lỗi nào. Vì vậy khoá của backend chỉ xuất hiện ở lúc gửi đi.
 */
export const SITE_STAT_FIELD = {
  "home.invitations": "homeInvitations",
  "home.templates": "homeTemplates",
  "home.rating": "homeRating",
} as const satisfies Record<SiteStatKey, string>;

/** `site-stats-form.tsx` — dải số liệu marketing. */
export function siteStatsSchema(e: AdminErrors) {
  const value = z
    .number({ message: e.numberMin })
    .min(0, e.numberMin)
    .max(9_999_999_999);

  return z.object({
    homeInvitations: value,
    homeTemplates: value,
    homeRating: value.max(5, e.numberMin),
  });
}

export type SiteStatsValues = z.infer<ReturnType<typeof siteStatsSchema>>;
