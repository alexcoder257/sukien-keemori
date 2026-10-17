"use client";

import { Suspense, use, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
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
 * Error boundary của toàn bộ khu vực `/{locale}`.
 *
 * Bọc mọi page và layout con, nhưng **không** bọc `app/[locale]/layout.tsx` —
 * lỗi ở chính root layout rơi xuống `app/global-error.tsx`.
 */
export default function LocaleError({ error, unstable_retry, reset }: Props) {
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params.locale) ? params.locale : defaultLocale;

  useEffect(() => {
    // Lỗi từ Server Component tới đây đã bị lược nội dung, chỉ còn `digest` để
    // dò ngược trong log server. Ghi ra console để người dùng báo lỗi còn có
    // cái mà chụp màn hình.
    console.error(error);
  }, [error]);

  return (
    // Chunk từ điển tải xong mới có chữ. `null` trong lúc chờ chứ không phải
    // một khung xám: khoảng chờ là vài chục mili giây, nháy một khối placeholder
    // rồi thay bằng chữ còn khó chịu hơn là hiện muộn một nhịp.
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
    <main className="container-page flex min-h-[70vh] flex-col justify-center py-20">
      <title>{t.meta}</title>
      <p className="flex items-center gap-3 text-eyebrow text-primary">
        <span aria-hidden className="h-px w-8 bg-primary/60" />
        {t.eyebrow}
      </p>
      <h1 className="mt-5 max-w-3xl font-editorial text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[1.12] font-medium tracking-[-0.03em]">
        {t.title}
      </h1>
      <p className="mt-5 max-w-2xl text-body-lg text-muted-foreground">
        {t.body}
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button onClick={onRetry}>{t.retry}</Button>
        <Link
          href={`/${locale}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t.home}
        </Link>
        <Link
          href={`/${locale}/lien-he`}
          className={buttonVariants({ variant: "ghost" })}
        >
          {t.contact}
        </Link>
      </div>

      {digest ? (
        <p className="mt-10 text-caption text-muted-foreground">
          {t.digestLabel}: <code className="font-mono">{digest}</code>
        </p>
      ) : null}
    </main>
  );
}
