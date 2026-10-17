import { Badge } from "@/components/ui/badge";
import type { AdminSession } from "@/constants/permission";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  dict: Dictionary["admin"];
  session: AdminSession | null;
};

/**
 * Chỉ **đọc** phiên. Vai trò do quản trị viên đặt trong `admin_users`, không
 * tự đổi được ở đây; đổi mật khẩu là form riêng bên dưới
 * (`change-password-form.tsx`).
 */
export function AccountPanel({ dict, session }: Props) {
  const t = dict.account;

  return (
    <section className="max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6 shadow-card">
      <dl className="space-y-5 text-small">
        <div className="space-y-1">
          <dt className="text-muted-foreground">{t.email}</dt>
          <dd className="font-medium">{session?.email || t.none}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-muted-foreground">{t.roles}</dt>
          <dd>
            {session?.role ? (
              <Badge variant="solid">{dict.adminRoles[session.role]}</Badge>
            ) : (
              t.none
            )}
          </dd>
        </div>
        <div className="space-y-2">
          <dt className="text-muted-foreground">{t.permissions}</dt>
          <dd className="flex flex-wrap gap-2">
            {session?.permissions.length
              ? session.permissions.map((permission) => (
                  <Badge key={permission} variant="outline">
                    {dict.permissions[permission]}
                  </Badge>
                ))
              : t.none}
          </dd>
        </div>
      </dl>
      <p className="text-caption text-muted-foreground">{t.rolesHint}</p>
    </section>
  );
}
