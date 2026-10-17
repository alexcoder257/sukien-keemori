import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/lib/data/request-path";
import { getAdminSession } from "@/lib/data/session";

/**
 * Trang 404 của khu quản trị.
 *
 * Next **không truyền `params`** cho `not-found.tsx`, nên locale phải đọc từ
 * header do `proxy.ts` gắn (xem `lib/data/request-path.ts`).
 *
 * Vẫn dựng nguyên `AdminShell`: người vận hành gõ nhầm URL cần thấy lại sidebar
 * để đi tiếp, chứ không phải một trang trắng bắt bấm Back. `active={null}` để
 * không mục nào bị tô sáng nhầm.
 */
export default async function AdminNotFound() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const session = await getAdminSession();
  const t = dict.errors.notFound;

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active={null}
      session={session}
      title={t.title}
    >
      <title>{t.meta}</title>
      <p className="max-w-2xl text-small text-muted-foreground">{t.body}</p>
      {/* `antd.Button` có `href` và tự render ra `<a>`; bọc thêm `next/link`
          quanh nó là lồng `<button>` trong `<a>`, HTML không hợp lệ. */}
      <div>
        <Button href={`/${locale}`}>{t.home}</Button>
      </div>
    </AdminShell>
  );
}
