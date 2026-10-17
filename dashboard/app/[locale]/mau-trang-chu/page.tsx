import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { HomepageTemplateForm } from "@/components/admin/homepage-template-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mau-trang-chu">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.homepage.title, robots: { index: false } };
}

/**
 * Dải mẫu ở trang chủ (spec mục 8): chọn mẫu nào và theo thứ tự nào.
 */
export default async function AdminHomepagePage({
  params,
}: PageProps<"/[locale]/mau-trang-chu">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="homepage"
      session={session}
      title={dict.admin.homepage.title}
      subtitle={dict.admin.homepage.subtitle}
    >
      <HomepageTemplateForm dict={dict.admin} commonDict={dict.common} />
    </AdminShell>
  );
}
