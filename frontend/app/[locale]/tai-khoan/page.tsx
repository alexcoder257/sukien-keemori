import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountView } from "@/components/account/account-view";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tai-khoan">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  // Trang sau đăng nhập — không có nội dung công khai nào để Google lưu.
  return { title: dict.account.meta.title, robots: NO_INDEX };
}

/** Route được `proxy.ts` gác đăng nhập; hồ sơ nạp phía client qua `/auth/me`. */
export default async function AccountPage({
  params,
}: PageProps<"/[locale]/tai-khoan">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <SiteHeader dict={dict.common} locale={locale} authenticated />
      <main className="container-page py-16">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="mb-8 text-h3">{dict.account.title}</h1>
          <AccountView
            dict={dict.account}
            phoneFieldDict={dict.common.phoneField}
            locale={locale}
          />
        </div>
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
