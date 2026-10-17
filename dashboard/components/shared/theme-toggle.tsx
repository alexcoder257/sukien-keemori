"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  dict: Dictionary["admin"]["theme"];
};

/**
 * Nút chuyển chế độ sáng/tối của CMS. **Bản sao có chủ đích** của
 * `frontend/components/shared/theme-toggle.tsx` — cùng quy ước với `apis/http.ts`
 * và `constants/role.ts`, xem `CLAUDE.md`. Khác một chỗ: ở đây nó là một dòng
 * trong khối cuối sidebar, đứng cạnh "Đổi mật khẩu" và "Đăng xuất", nên nó
 * dùng đúng markup của hai dòng đó thay vì `Button`.
 *
 * Mặc định là "theo hệ thống"; cú bấm đầu tiên chốt hẳn một chế độ và
 * `next-themes` nhớ lựa chọn đó. Không có nút quay lại "theo hệ thống" vì người
 * đã tự chọn một chế độ thì hầu như không đổi ý, còn ba trạng thái trên một nút
 * thì không đoán được lần bấm sau ra gì.
 *
 * `mounted` là bắt buộc: chế độ thật chỉ biết được ở trình duyệt, nên server
 * dựng ra nhãn nào cũng có thể sai. Trước khi mount thì vẫn vẽ đúng khung dòng
 * với `aria-hidden` để bố cục sidebar không nhảy, thay vì trả về `null`.
 */
const subscribeNoop = () => () => {};

export function ThemeToggle({ dict }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";
  const label = isDark ? dict.switchToLight : dict.switchToDark;
  const className =
    "flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-small text-foreground transition-colors hover:bg-muted";

  if (!mounted) {
    return (
      <span aria-hidden className={className}>
        <Sun className="size-[18px] text-muted-foreground" />
        <span className="opacity-0">{dict.switchToDark}</span>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")} className={className}>
      {isDark ? (
        <Sun aria-hidden className="size-[18px] text-muted-foreground" />
      ) : (
        <Moon aria-hidden className="size-[18px] text-muted-foreground" />
      )}
      <span>{label}</span>
    </button>
  );
}
