import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { HomepageHeroForm } from "@/components/admin/homepage-hero-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thiep-mau-trang-chu">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.homepageHero.title, robots: { index: false } };
}

/**
 * Thiệp mẫu ở hero trang chủ — màn đầu tiên của nhóm Trang chủ, đúng thứ tự
 * ba khối xuất hiện trên trang: hero → dải mẫu nổi bật → dải cặp đôi.
 */
export default async function AdminHomepageHeroPage({
  params,
}: PageProps<"/[locale]/thiep-mau-trang-chu">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="homepageHero"
      session={session}
      title={dict.admin.homepageHero.title}
      subtitle={dict.admin.homepageHero.subtitle}
    >
      <HomepageHeroForm dict={dict.admin} />
    </AdminShell>
  );
}
