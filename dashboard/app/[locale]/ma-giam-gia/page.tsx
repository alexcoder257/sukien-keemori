import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { VoucherTable } from "@/components/admin/voucher-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/ma-giam-gia">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.vouchers.title, robots: { index: false } };
}

/**
 * Mã giảm giá — quyền `vouchers:manage`. Ẩn mục nav là chuyện giao diện;
 * backend chặn `/admin/vouchers` bằng `@Permissions('vouchers:manage')`.
 */
export default async function AdminVouchersPage({
  params,
}: PageProps<"/[locale]/ma-giam-gia">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="vouchers"
      session={session}
      title={dict.admin.vouchers.title}
      subtitle={dict.admin.vouchers.subtitle}
    >
      <VoucherTable dict={dict.admin} commonDict={dict.common} />
    </AdminShell>
  );
}
