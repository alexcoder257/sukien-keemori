import { LogOut } from "lucide-react";
import type { Locale } from "@/i18n/config";

/**
 * Đăng xuất bằng một form `POST` tới `/api/auth/logout`: route đó thu hồi
 * refresh token ở backend, xoá cookie phiên rồi chuyển về trang đăng nhập.
 *
 * Form chứ không phải `fetch`: điều hướng toàn trang xoá luôn cache React
 * Query của phiên vừa thoát — không để người đăng nhập kế tiếp thấy bảng của
 * người trước.
 */
export function SignOutButton({
  label,
  locale,
}: {
  label: string;
  locale: Locale;
}) {
  return (
    <form action={`/api/auth/logout?locale=${locale}`} method="post">
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-small text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut aria-hidden className="size-3.5" />
        {label}
      </button>
    </form>
  );
}
