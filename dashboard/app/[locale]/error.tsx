"use client";

import { Suspense, use, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { loadErrorDictionary } from "@/i18n/error-dictionary";

type Props = {
  error: Error & { digest?: string };
  /**
   * Next 16.2 trở lên: dựng lại **cả dữ liệu** của segment rồi render lại. Khác
   * `reset()` — cái đó chỉ xoá trạng thái lỗi và render lại bằng dữ liệu cũ,
   * tức nếu lỗi đến từ một cú fetch hỏng thì nó hỏng lại ngay. Xem
   * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.
   */
  unstable_retry?: () => void;
  reset: () => void;
};

/**
 * Error boundary của khu quản trị.
 *
 * Cố tình **không** dựng `AdminShell` như trang 404: sidebar cần `dict.admin`
 * và phiên đăng nhập, cả hai đều là dữ liệu server, mà Client Component thì không nhận
 * được props từ server. Trang 404 là Server Component nên nó dựng được; trang
 * này thì không, và nhồi thêm một cú gọi API vào đúng lúc app vừa lỗi là cách
 * chắc chắn để hỏng thêm lần nữa.
 */
export default function AdminError({ error, unstable_retry, reset }: Props) {
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params.locale) ? params.locale : defaultLocale;

  useEffect(() => {
    // Lỗi từ Server Component tới đây đã bị lược nội dung, chỉ còn `digest` để
    // dò ngược trong log server.
    console.error(error);
  }, [error]);

  return (
    <Suspense fallback={null}>
      <ErrorBody
        locale={locale}
        digest={error.digest}
        onRetry={unstable_retry ?? reset}
      />
    </Suspense>
  );
}

function ErrorBody({
  locale,
  digest,
  onRetry,
}: {
  locale: Locale;
  digest?: string;
  onRetry: () => void;
}) {
  const t = use(loadErrorDictionary(locale)).runtime;

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-6 py-10">
      <title>{t.meta}</title>
      <h1 className="text-h4 font-semibold">{t.title}</h1>
      <p className="mt-3 text-small text-muted-foreground">{t.body}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={onRetry}>{t.retry}</Button>
        {/* `antd.Button` có `href` và tự render ra `<a>`. */}
        <Button variant="outline" href={`/${locale}`}>
          {t.home}
        </Button>
      </div>

      {digest ? (
        <p className="mt-8 text-caption text-muted-foreground">
          {t.digestLabel}: <code className="font-mono">{digest}</code>
        </p>
      ) : null}
    </main>
  );
}
