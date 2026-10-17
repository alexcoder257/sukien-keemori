import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cai-dat">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.settings.title, robots: { index: false } };
}

/** Cấu hình vận hành: thời gian tồn tại và trần lượt xem của link (spec mục 3). */
export default async function AdminSettingsPage({
  params,
}: PageProps<"/[locale]/cai-dat">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="settings"
      session={session}
      title={dict.admin.settings.title}
      subtitle={dict.admin.settings.subtitle}
    >
      <SiteSettingsForm dict={dict.admin} />
    </AdminShell>
  );
}
