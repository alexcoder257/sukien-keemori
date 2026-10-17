import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { TemplateStatsTable } from "@/components/admin/template-stats-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mau-xem-nhieu">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.templateStats.title, robots: { index: false } };
}

/**
 * Mẫu nào trong kho mẫu được khách bấm vào nhiều, so với số thiệp tạo ra từ
 * mẫu đó trong cùng kỳ.
 */
export default async function AdminTemplateStatsPage({
  params,
}: PageProps<"/[locale]/mau-xem-nhieu">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="templateStats"
      session={session}
      title={dict.admin.templateStats.title}
      subtitle={dict.admin.templateStats.subtitle}
    >
      <TemplateStatsTable
        dict={dict.admin}
        commonDict={dict.common}
        locale={locale}
      />
    </AdminShell>
  );
}
