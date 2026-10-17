import type { Locale } from "@/i18n/config";

/**
 * Một ô trưng bày trên trang chủ trỏ tới thiệp nào — **bản sao có chủ đích**
 * của `SHOWCASE_KINDS` ở `backend/src/common/enums/invitation.enum.ts`, cùng
 * quy ước với `apis/http.ts` và `constants/role.ts`.
 */
export type ShowcaseKind = "card" | "template";

/**
 * Đường dẫn của một ô trưng bày.
 *
 * Hai loại vì kho mẫu có hơn 60 mẫu mà thiệp demo dựng sẵn chỉ có mười mấy:
 * mẫu nào cũng có sẵn trang `/mau-thiep/<slug>/demo`, nên cho phép trỏ thẳng
 * vào đó mở rộng thứ người vận hành chọn được lên gấp năm lần.
 *
 * `kind` là dữ liệu lưu cùng ô, **không suy từ slug**: hai bảng khác nhau và
 * không có gì cấm một mẫu trùng slug với một thiệp.
 */
export function showcaseHref(
  kind: ShowcaseKind,
  slug: string,
  locale: Locale,
): string {
  return kind === "template"
    ? `/${locale}/mau-thiep/${slug}/demo`
    : `/${locale}/t/${slug}`;
}
