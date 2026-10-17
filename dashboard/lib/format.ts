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
export function formatDateTime(value: string, locale: Locale): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return value;
  const tag = locale === "vi" ? "vi-VN" : "en-US";
  const time = date.toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day = date.toLocaleDateString(tag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${time} · ${day}`;
}

/** Độ dài/thời điểm của một đoạn audio, dạng `m:ss` hoặc `h:mm:ss`. */
export function formatDuration(seconds: number): string {
  const total =
    Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
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

/**
 * Nhãn ngày cưới `dd/mm/yyyy` của ô trưng bày trang chủ, dựng từ
 * `content.countdown.weddingDate` của thiệp.
 *
 * Giá trị editor ghi là giờ **Việt Nam** không kèm múi giờ
 * (`2026-11-22T17:30`), nên đọc thẳng phần ngày thay vì qua `Date` — đổi sang
 * giờ của máy người vận hành có thể lùi sang hôm trước. Chỉ khi chuỗi mang múi
 * giờ tường minh mới quy về `Asia/Ho_Chi_Minh`, đúng như `weddingInstant` bên
 * `frontend/`. Chuỗi lạ trả rỗng để ô nhãn không bị điền rác.
 */
export function weddingDateLabel(value: string | null): string {
  if (!value) return "";
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" });
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

/** `YYYY-MM-DD` của hôm nay theo giờ Việt Nam — cùng múi với ngày cưới editor ghi. */
export function vietnamToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Bóc ngày và giờ tại chỗ từ `content.countdown.weddingDate`
 * (`YYYY-MM-DDTHH:mm:00+07:00`). Editor ghi sẵn giờ Việt Nam, nên đọc thẳng
 * chuỗi chứ không qua `Date` — đổi múi giờ ở đây chỉ làm lệch ngày.
 */
export function weddingDateParts(
  value: string | null,
): { date: string; time: string | null } | null {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/.exec(value ?? "");
  return match ? { date: match[1], time: match[2] ?? null } : null;
}

/** Số ngày từ `from` tới `to` (đều là `YYYY-MM-DD`); âm là `to` đã qua. */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}
