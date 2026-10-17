import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SiteStatsForm } from "@/components/admin/site-stats-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/so-lieu">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.siteStats.title, robots: { index: false } };
}

/** Dải số liệu công bố ở trang chủ và trang đối tác. */
export default async function AdminSiteStatsPage({
  params,
}: PageProps<"/[locale]/so-lieu">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="siteStats"
      session={session}
      title={dict.admin.siteStats.title}
      subtitle={dict.admin.siteStats.subtitle}
    >
      <SiteStatsForm dict={dict.admin} />
    </AdminShell>
  );
}
