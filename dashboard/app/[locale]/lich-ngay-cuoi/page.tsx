import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { WeddingCalendarTable } from "@/components/admin/wedding-calendar-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lich-ngay-cuoi">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.weddings.title, robots: { index: false } };
}

/**
 * Lịch ngày cưới: thiệp xếp theo ngày cưới gần nhất, để gửi lời chúc đúng ngày.
 */
export default async function AdminWeddingCalendarPage({
  params,
}: PageProps<"/[locale]/lich-ngay-cuoi">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="weddings"
      session={session}
      title={dict.admin.weddings.title}
      subtitle={dict.admin.weddings.subtitle}
    >
      <WeddingCalendarTable
        dict={dict.admin}
        locale={locale}
      />
    </AdminShell>
  );
}
