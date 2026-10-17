import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { OverviewPanel } from "@/components/admin/overview-panel";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";
import { hasPermission } from "@/constants/permission";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.meta.title, robots: { index: false } };
}

/** Trang mặc định là tổng quan số liệu; các màn còn lại dành cho vận hành/config. */
export default async function AdminPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="dashboard"
      session={session}
      title={dict.admin.title}
      subtitle={dict.admin.overview.subtitle}
    >
      <OverviewPanel
        dict={dict.admin}
        locale={locale}
        canViewAnalytics={hasPermission(session, "analytics:view")}
      />
    </AdminShell>
  );
}
