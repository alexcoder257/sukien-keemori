import type { Locale } from "@/i18n/config";

/**
 * Thay các placeholder `{name}` trong chuỗi dịch bằng giá trị tương ứng.
 * Dùng cho text đã lấy từ dictionary, không dùng để dựng câu từ nhiều mảnh.
 */
export function fill(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Giá niêm yết luôn là VND, chỉ cách hiển thị số thay đổi theo locale. */
export function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Ngày cưới/ngày tiệc do người dùng nhập tự do. Nếu là ISO date thì hiển thị
 * theo locale, ngược lại giữ nguyên chuỗi họ đã nhập.
 */
export function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Thời điểm một lời chúc được gửi: giờ trước, ngày sau — nhịp đọc của một dòng
 * sổ lưu bút, nơi "khi nào trong ngày" đáng chú ý hơn "ngày nào".
 *
 * Chuỗi không phải ISO thì trả về nguyên văn, giống `formatDate`: dữ liệu này
 * do backend cấp nhưng lớp trình bày không được vỡ vì một giá trị lạ.
 */
export function formatDateTime(
  value: string,
  locale: Locale,
  timeZone?: string,
): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return value;
  const tag = locale === "vi" ? "vi-VN" : "en-US";
  const time = date.toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  return `${time} · ${formatShortDate(value, locale, timeZone)}`;
}

/**
 * Ngày dạng số (`21/09/2026`), cho những chỗ chỉ cần biết "ngày nào" — như
 * ngày tạo thiệp. Truyền `timeZone` khi render ở server, nếu không ngày lệch
 * theo múi giờ của máy chủ.
 */
export function formatShortDate(
  value: string,
  locale: Locale,
  timeZone?: string,
): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  });
}

/** Độ dài/thời điểm của một đoạn audio, dạng `m:ss` hoặc `h:mm:ss`. */
export function formatDuration(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const pad = (value: number) => String(value).padStart(2, "0");
  const base = `${hours > 0 ? `${hours}:${pad(minutes)}` : minutes}:${pad(total % 60)}`;
  return base;
}

export function formatNumber(
  value: number,
  locale: Locale,
  decimals = 0,
): string {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
