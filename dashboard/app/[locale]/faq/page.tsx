import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { FaqTable } from "@/components/admin/faq-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.faq.title, robots: { index: false } };
}

/**
 * FAQ hiện ở trang chủ (spec mục 4). Mỗi câu mang cả hai ngôn ngữ vì FAQ là
 * text giao diện.
 */
export default async function AdminFaqPage({
  params,
}: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="faq"
      session={session}
      title={dict.admin.faq.title}
      subtitle={dict.admin.faq.subtitle}
    >
      <FaqTable dict={dict.admin} commonDict={dict.common} />
    </AdminShell>
  );
}
