import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/nhat-ky">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.audit.title, robots: { index: false } };
}

/**
 * Nhật ký thao tác — quyền `super_admin`.
 *
 * Không phải `admin`, dù phần lớn dòng trong đây là việc của admin: nhật ký là
 * thứ để soi lại chính người vận hành, mở cho `admin` thì người bị soi cũng là
 * người đọc được nhật ký về mình. Backend gác lại bằng `@Roles('super_admin')`
 * trên `/admin/audit-logs` — ẩn mục ở sidebar chỉ là chuyện giao diện.
 */
export default async function AdminAuditPage({
  params,
}: PageProps<"/[locale]/nhat-ky">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="audit"
      session={session}
      title={dict.admin.audit.title}
      subtitle={dict.admin.audit.subtitle}
    >
      <AuditLogTable dict={dict.admin} locale={locale} />
    </AdminShell>
  );
}
