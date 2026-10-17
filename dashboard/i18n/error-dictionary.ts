import type viDictionary from "@/dictionaries/vi.json";
import type { Locale } from "./config";

/**
 * `import type` nên khai báo trên bị xoá sạch lúc build — lấy được kiểu của từ
 * điển mà không kéo JSON vào bundle.
 */
export type ErrorDictionary = (typeof viDictionary)["errors"];

/**
 * Nạp cụm chữ báo lỗi **ở phía client**.
 *
 * `i18n/dictionaries.ts` là `server-only` và đúng như vậy: mọi màn bình thường
 * nạp từ điển ở server rồi truyền xuống bằng props. `error.tsx` là ngoại lệ
 * bắt buộc — React yêu cầu error boundary phải là Client Component, mà Client
 * Component thì không nhận được props từ server. Đường này **chỉ dành cho
 * error boundary**.
 *
 * Dùng `import()` động chứ không import tĩnh: từ điển nặng ~24KB mỗi bản, import
 * tĩnh là nhét cả hai vào bundle của mọi route chỉ để phòng khi có lỗi.
 *
 * `Record<Locale, …>` làm hai việc cùng lúc: thiếu loader cho một locale mới là
 * lỗi biên dịch, và `en.json` lệch hình dạng so với `vi.json` cũng là lỗi biên
 * dịch — hai bản dịch không còn trôi khỏi nhau trong im lặng.
 */
const loaders: Record<Locale, () => Promise<ErrorDictionary>> = {
  vi: () => import("@/dictionaries/vi.json").then((m) => m.default.errors),
  en: () => import("@/dictionaries/en.json").then((m) => m.default.errors),
};

/**
 * Cache theo locale là **bắt buộc**, không phải tối ưu: `use()` treo component
 * lại cho tới khi promise xong rồi render lại; tạo promise mới ở mỗi lần render
 * thì lần render sau lại treo tiếp, thành vòng lặp vô tận.
 */
const cache = new Map<Locale, Promise<ErrorDictionary>>();

export function loadErrorDictionary(locale: Locale): Promise<ErrorDictionary> {
  const cached = cache.get(locale);
  if (cached) return cached;
  const pending = loaders[locale]();
  cache.set(locale, pending);
  return pending;
}
