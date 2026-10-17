import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PaymentsWorkspace } from "@/components/admin/payments-workspace";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/giao-dich">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.payments.title, robots: { index: false } };
}

/**
 * Thanh toán — tra cứu đơn mua thiệp và tiền vào, quyền `payments:manage`.
 *
 * Đây là việc vận hành khi khách báo sự cố thanh toán, không phải báo cáo kinh
 * doanh.
 *
 * `?q=` điền sẵn ô tìm kiếm — lối vào từ màn Người dùng.
 */
export default async function AdminPaymentsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/giao-dich">) {
  const { locale } = await params;
  const { q } = await searchParams;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="payments"
      session={session}
      title={dict.admin.payments.title}
      subtitle={dict.admin.payments.subtitle}
    >
      <PaymentsWorkspace
        dict={dict.admin}
        commonDict={dict.common}
        locale={locale}
        initialQuery={typeof q === "string" ? q : ""}
      />
    </AdminShell>
  );
}
