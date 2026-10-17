import "server-only";
import { cache } from "react";
import { defaultLocale, type Locale } from "./config";

/**
 * Locale của lượt render hiện tại, cho những file Next **không truyền
 * `params`** — hiện chỉ `app/[locale]/not-found.tsx`.
 *
 * Layout `[locale]` ghi vào, trang 404 đọc ra. `cache()` của React sống đúng
 * một lượt render phía server, nên đây là "context" cho Server Component: không
 * rò giữa hai request, và **không đọc gì của request** — khác cách cũ là đọc
 * header `x-pathname` do proxy gắn. Cách cũ kéo *mọi* trang về render động:
 * Next render sẵn `not-found.tsx` trong payload của mọi page (làm boundary
 * dự phòng), nên một `headers()` trong đó là "Page changed from static to
 * dynamic at runtime … reason: headers" (500) trên mọi trang tĩnh.
 *
 * Đọc được vì layout chạy trước: phần tử 404 là con của layout trong cây.
 * Chưa có ai ghi (locale lạ, layout gọi `notFound()` trước khi ghi) thì rơi về
 * `defaultLocale` — đúng với `proxy.ts`, nơi URL không mang locale luôn bị
 * chuyển sang `/${defaultLocale}`.
 */
const holder = cache((): { locale: Locale } => ({ locale: defaultLocale }));

export function setRequestLocale(locale: Locale) {
  holder().locale = locale;
}

export function getRequestLocale(): Locale {
  return holder().locale;
}
