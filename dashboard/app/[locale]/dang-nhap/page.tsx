import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dang-nhap">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: `${dict.auth.login.title} — CMS` };
}

/**
 * Cửa vào CMS: form email + mật khẩu của tài khoản trong `admin_users`.
 * `?next=` do `proxy.ts` gắn khi đẩy về đây; `?notice=` do form đổi mật khẩu
 * gắn khi tự đăng xuất sau lúc đổi.
 */
export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dang-nhap">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const query = await searchParams;
  const pick = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : null;

  return (
    <SignInPanel
      dict={dict.auth}
      locale={locale}
      next={pick(query.next)}
      notice={pick(query.notice)}
    />
  );
}
