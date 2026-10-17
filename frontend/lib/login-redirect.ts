import type { Locale } from "@/i18n/config";

/**
 * Link sang trang đăng nhập rồi quay lại **đúng chỗ đang đứng**, kể cả query
 * (`/mau-thiep?tier=gold`).
 *
 * Chỉ gọi lúc bấm, ở client. Đọc `window.location` chứ không `useSearchParams()`:
 * hook đó kéo cả cây phía trên nó xuống render ở client, mà những component
 * gọi hàm này nằm trong trang public dựng tĩnh — cùng lý do với
 * `locale-switcher.tsx`.
 */
export function loginRedirectHref(locale: Locale): string {
  const next = `${window.location.pathname}${window.location.search}`;
  return `/${locale}/dang-nhap?next=${encodeURIComponent(next)}`;
}
