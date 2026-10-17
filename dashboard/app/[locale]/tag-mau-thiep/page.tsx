import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { TemplateTagTable } from "@/components/admin/template-tag-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tag-mau-thiep">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.templateTags.title, robots: { index: false } };
}

/**
 * Bậc và tag của mẫu thiệp (spec mục 7).
 */
export default async function AdminTemplateTagsPage({
  params,
}: PageProps<"/[locale]/tag-mau-thiep">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="templateTags"
      session={session}
      title={dict.admin.templateTags.title}
      subtitle={dict.admin.templateTags.subtitle}
    >
      <TemplateTagTable dict={dict.admin} commonDict={dict.common} />
    </AdminShell>
  );
}
