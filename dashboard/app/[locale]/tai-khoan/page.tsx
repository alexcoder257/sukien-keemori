import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AccountPanel } from "@/components/admin/account-panel";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tai-khoan">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.account.title, robots: { index: false } };
}

/**
 * Tài khoản của chính người đang đăng nhập: email, vai trò, quyền, và đổi mật
 * khẩu.
 *
 * Không nằm trong bản đồ sidebar: đó là bản đồ **tính năng vận hành**, còn đây
 * là thao tác cá nhân. Mọi tài khoản đều vào được — không cần quyền nào.
 */
export default async function AdminAccountPage({
  params,
}: PageProps<"/[locale]/tai-khoan">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active={null}
      session={session}
      title={dict.admin.account.title}
      subtitle={dict.admin.account.subtitle}
    >
      <div className="space-y-6">
        <AccountPanel dict={dict.admin} session={session} />
        <ChangePasswordForm
          dict={dict.admin}
          locale={locale}
          email={session?.email ?? ""}
        />
      </div>
    </AdminShell>
  );
}
