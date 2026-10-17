import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { UserTable } from "@/components/admin/user-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";
import { hasPermission } from "@/constants/permission";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/nguoi-dung">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.users.title, robots: { index: false } };
}

/**
 * Bảng người dùng (spec mục 1): tài khoản khách (`customer`).
 *
 * `proxy.ts` chỉ gác đăng nhập, còn quyền admin do backend kiểm tra ở mọi route
 * `/*`. Vai trò đọc từ token ở đây chỉ để chọn giao diện.
 */
export default async function AdminUsersPage({
  params,
}: PageProps<"/[locale]/nguoi-dung">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="users"
      session={session}
      title={dict.admin.users.title}
      subtitle={dict.admin.users.subtitle}
    >
      <UserTable
        dict={dict.admin}
        commonDict={dict.common}
        locale={locale}
        canDelete={hasPermission(session, "users:delete")}
        canViewPayments={hasPermission(session, "payments:manage")}
      />
    </AdminShell>
  );
}
