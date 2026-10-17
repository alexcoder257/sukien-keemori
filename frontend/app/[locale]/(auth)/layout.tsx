import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

export default async function AuthLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    // Trên màn hình hẹp thẻ bám sát mép trên: điện thoại cao thì `justify-center`
    // đẩy form xuống giữa và người dùng mở trang ra chỉ thấy một khoảng trống,
    // phải cuộn mắt xuống mới gặp ô email. Từ `sm` trở lên mới căn giữa, vì lúc
    // đó khoảng trống hai bên đã cân và thẻ đọc ra như một hộp đăng nhập.
    <div className="relative flex min-h-svh flex-col items-center justify-start overflow-hidden bg-muted/40 px-4 pt-6 pb-10 sm:justify-center sm:pt-10">
      {/* Decorative background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-primary)/8%,transparent_70%)]"
      />
      <div className="w-full max-w-[400px]">
        <Link
          href={`/${locale}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {dict.auth.backToHome}
        </Link>
        {children}
      </div>
    </div>
  );
}
