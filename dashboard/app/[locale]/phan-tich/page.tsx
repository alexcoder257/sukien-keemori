import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AnalyticsPanel } from "@/components/admin/analytics-panel";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/phan-tich">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.analytics.title, robots: { index: false } };
}

/**
 * Phân tích (spec mục 10) — quyền `super_admin`.
 */
export default async function AdminAnalyticsPage({
  params,
}: PageProps<"/[locale]/phan-tich">) {
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
      title={dict.admin.analytics.title}
      subtitle={dict.admin.analytics.subtitle}
    >
      <AnalyticsPanel dict={dict.admin} locale={locale} />
    </AdminShell>
  );
}
