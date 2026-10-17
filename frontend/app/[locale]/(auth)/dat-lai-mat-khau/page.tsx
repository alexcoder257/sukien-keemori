import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { NO_INDEX } from "@/lib/seo";

/**
 * Trang này đọc request (`searchParams` — mã đặt lại mật khẩu) nên phải render theo từng lượt xem.
 *
 * Phải khai tường minh: layout `[locale]` để `generateStaticParams` rỗng (trang
 * public dựng lúc có người vào lần đầu), nên lúc build Next không dựng thử
 * trang nào và **không tự phát hiện** được trang động. Thiếu dòng này thì bản
 * build coi trang là tĩnh và ném 500 "Page changed from static to dynamic at
 * runtime" ở lượt xem đầu tiên — `next dev` không báo gì.
 *
 * `revalidate = 0` chứ không `force-dynamic`: cái sau tắt luôn cache của mọi
 * `fetch` trong trang, còn cái này giữ nguyên `fetch` đã khai `revalidate`.
 */
export const revalidate = 0;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  // Bước giữa của một luồng, không phải trang đích của ai cả.
  return { title: dict.auth.reset.title, robots: NO_INDEX };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  // Token dùng một lần, đến từ link trong email đặt lại mật khẩu.
  const sp = await searchParams;
  const tokenParam = sp.token;
  const token = (Array.isArray(tokenParam) ? tokenParam[0] : tokenParam) ?? null;

  return <ResetPasswordForm dict={dict.auth} locale={locale} token={token} />;
}
