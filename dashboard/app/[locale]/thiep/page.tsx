import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { CardTable } from "@/components/admin/card-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thiep">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.cards.title, robots: { index: false } };
}

/**
 * Lịch sử thiệp của mọi cặp đôi (spec mục 9). Chỉ đọc; nội dung thiệp không
 * được trả về khu quản trị.
 */
export default async function AdminCardsPage({
  params,
}: PageProps<"/[locale]/thiep">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="cards"
      session={session}
      title={dict.admin.cards.title}
      subtitle={dict.admin.cards.subtitle}
    >
      <CardTable dict={dict.admin} locale={locale} />
    </AdminShell>
  );
}
