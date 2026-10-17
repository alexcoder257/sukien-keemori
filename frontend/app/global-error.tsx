"use client";

import { useEffect, useSyncExternalStore } from "react";
import { inter } from "@/assets/fonts";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import "./globals.css";

/**
 * Lưới cuối cùng: lỗi ném ra từ chính `app/[locale]/layout.tsx`.
 *
 * File này **thay thế** root layout khi bật, nên phải tự dựng `<html>` và
 * `<body>`, tự nạp font và global CSS — không có provider nào của app còn sống
 * ở đây. Cũng vì thế nó không export được `metadata`; tiêu đề tab đặt bằng thẻ
 * `<title>` của React.
 *
 * **Chữ được viết thẳng trong file này**, cố ý đi ngược quy ước "text nằm ở
 * `dictionaries/`". Từ điển chỉ với tới được bằng `import()` động, tức là một
 * request chunk nữa — mà nếu thứ vừa hỏng chính là app shell hoặc đường tải
 * chunk thì màn hình cuối cùng cũng trắng nốt. Bốn câu ở đây phải hiện ra được
 * kể cả khi mọi thứ khác đã hỏng. Sửa chữ thì sửa cả `errors.global` trong
 * `vi.json`/`en.json` cho khớp.
 */
const TEXT = {
  vi: {
    title: "Không tải được trang",
    body: "Ứng dụng gặp sự cố nghiêm trọng và không thể hiển thị. Vui lòng tải lại trang.",
    retry: "Tải lại",
    digestLabel: "Mã lỗi",
  },
  en: {
    title: "The page could not load",
    body: "The application hit a fatal error and cannot be displayed. Please reload the page.",
    retry: "Reload",
    digestLabel: "Error code",
  },
} satisfies Record<Locale, Record<string, string>>;

type Props = {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset: () => void;
};

/**
 * Không có `params` ở đây, và root layout — nơi duy nhất biết locale — chính là
 * thứ vừa hỏng, nên chỉ còn `window.location` để đọc.
 *
 * `useSyncExternalStore` chứ không phải `useState` + `useEffect`: bản server
 * (không có `window`) và bản client phải khác nhau, và đây là API React dựng ra
 * đúng cho chuyện đó — nó nhận riêng một `getServerSnapshot`, nên bản HTML dựng
 * ở server và lần render đầu ở client khớp nhau, không sinh hydration mismatch.
 * Viết bằng `setState` trong effect thì vừa nháy một nhịp vừa bị
 * `react-hooks/set-state-in-effect` chặn ở lint.
 *
 * Địa chỉ không đổi trong vòng đời màn báo lỗi này nên `subscribe` không cần
 * lắng nghe gì; `getSnapshot` trả về chuỗi hằng nên vẫn ổn định qua mỗi lần so.
 */
const NO_OP_UNSUBSCRIBE = () => () => {};

function readLocaleFromUrl(): Locale {
  const [, segment] = window.location.pathname.split("/");
  return isLocale(segment) ? segment : defaultLocale;
}

function getServerLocale(): Locale {
  return defaultLocale;
}

export default function GlobalError({ error, unstable_retry, reset }: Props) {
  const locale = useSyncExternalStore(
    NO_OP_UNSUBSCRIBE,
    readLocaleFromUrl,
    getServerLocale,
  );

  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = TEXT[locale];

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <title>{t.title}</title>
        <main className="container-page flex min-h-screen flex-col justify-center py-20">
          <h1 className="max-w-3xl font-heading text-h3 font-medium">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-body-lg text-muted-foreground">
            {t.body}
          </p>
          <div className="mt-10">
            <button
              type="button"
              onClick={unstable_retry ?? reset}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-small font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t.retry}
            </button>
          </div>
          {error.digest ? (
            <p className="mt-10 text-caption text-muted-foreground">
              {t.digestLabel}: <code className="font-mono">{error.digest}</code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
