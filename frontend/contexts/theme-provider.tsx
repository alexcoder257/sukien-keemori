"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Chế độ sáng/tối của **giao diện website** (trang chủ, kho mẫu, editor, tài
 * khoản). Mẫu thiệp không nằm trong phạm vi này — xem `.theme-invitation` ở
 * `app/globals.css`.
 *
 * **Mặc định là tối, và cố ý không đọc `prefers-color-scheme`.** Art direction
 * của website là nền đen (Forest Ink) với champagne — đó là thứ khách nhìn
 * thấy ở lần vào đầu tiên, không phụ thuộc cài đặt hệ điều hành của máy họ.
 * `enableSystem={false}` nên `next-themes` chỉ còn hai giá trị `light` /
 * `dark`; ai muốn nền giấy thì bấm nút ở header, và lựa chọn đó được nhớ trong
 * `localStorage`.
 *
 * `attribute="class"` để `next-themes` gắn `.light` / `.dark` lên `<html>`,
 * đúng thứ mà `@custom-variant dark` và hai khối token trong `globals.css`
 * đang chờ. Thư viện tự chèn một script chạy trước lần vẽ đầu tiên nên không
 * có cú nháy trắng khi tải lại trang ở chế độ tối; đổi lại `<html>` phải có
 * `suppressHydrationWarning` (đã có sẵn trong layout).
 *
 * `disableTransitionOnChange` tắt mọi transition trong đúng khoảnh khắc đổi
 * chế độ: nền, viền và chữ đều đang có transition riêng nên nếu để nguyên thì
 * chúng chạy lệch pha nhau và trang trông như bị vỡ trong nửa giây.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
