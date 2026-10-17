"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Chế độ sáng/tối của CMS.
 *
 * `attribute="class"` vì `app/globals.css` khai token dưới selector `.dark`, và
 * `@custom-variant dark` của Tailwind cũng bám vào class đó — một cơ chế cho cả
 * token thủ công lẫn class `dark:`.
 *
 * Mặc định là **theo hệ thống**: người vận hành mở CMS cạnh các app khác trên
 * cùng máy, và bắt họ chọn tay một lần nữa chỉ để khớp với phần còn lại của
 * màn hình là thừa. Bấm nút thì lựa chọn được ghi vào `localStorage`.
 *
 * `disableTransitionOnChange` chặn cú nháy màu: không có nó thì mọi
 * `transition-colors` rải trong `components/admin/` cùng chạy một lượt lúc đổi
 * chế độ, và cả trang loang màu trong 200ms.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
