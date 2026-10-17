import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PriceConfigForm } from "@/components/admin/price-config-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/bang-gia">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.priceConfig.title, robots: { index: false } };
}

/**
 * Bảng giá một gói — quyền `pricing:manage`. Ẩn mục nav là chuyện giao diện;
 * backend chặn `PATCH /admin/pricing` bằng `@Permissions('pricing:manage')`.
 */
export default async function AdminPricingPage({
  params,
}: PageProps<"/[locale]/bang-gia">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="priceConfig"
      session={session}
      title={dict.admin.priceConfig.title}
      subtitle={dict.admin.priceConfig.subtitle}
    >
      <PriceConfigForm dict={dict.admin} locale={locale} />
    </AdminShell>
  );
}
