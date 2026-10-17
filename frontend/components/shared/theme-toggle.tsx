"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Props = {
  dict: Dictionary["common"]["theme"];
  className?: string;
  /** `icon` cho thanh header, `full` cho menu mobile (có chữ đi kèm). */
  variant?: "icon" | "full";
};

/**
 * Nút chuyển chế độ sáng/tối của giao diện website.
 *
 * Mặc định là **nền tối** — website không đọc `prefers-color-scheme` của trình
 * duyệt (xem `contexts/theme-provider.tsx`). Nút này chỉ lật giữa hai chế độ và
 * `next-themes` nhớ lựa chọn đó trong `localStorage`; không có trạng thái "theo
 * hệ thống" để quay về, vì ba trạng thái trên một nút thì không đoán được lần
 * bấm sau ra gì.
 *
 * `mounted` là bắt buộc: chế độ thật chỉ biết được ở trình duyệt, nên server
 * dựng ra nhãn nào cũng có thể sai. Trước khi mount thì vẽ đúng khung nút với
 * `aria-hidden` để bố cục không nhảy, thay vì trả về `null`.
 *
 * Dùng `useSyncExternalStore` thay cho cặp `useState` + `useEffect`: ở đây
 * "đã ở trình duyệt hay chưa" đúng là một giá trị đến từ bên ngoài React, và
 * nó tránh được vòng render thừa mà `setState` trong effect gây ra.
 */
const subscribeNoop = () => () => {};

export function ThemeToggle({ dict, className, variant = "icon" }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";
  const label = isDark ? dict.switchToLight : dict.switchToDark;

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size={variant === "icon" ? "icon-sm" : "default"}
        className={cn(variant === "full" && "justify-start gap-2", className)}
        aria-hidden
        tabIndex={-1}
        disabled
      >
        <Sun />
        {variant === "full" ? <span className="opacity-0">{dict.label}</span> : null}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size={variant === "icon" ? "icon-sm" : "default"}
      className={cn(variant === "full" && "justify-start gap-2", className)}
      aria-label={variant === "icon" ? label : undefined}
      title={variant === "icon" ? label : undefined}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
      {variant === "full" ? label : null}
    </Button>
  );
}
