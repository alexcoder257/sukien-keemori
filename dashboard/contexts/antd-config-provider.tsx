"use client";

import type { ReactNode } from "react";
import { App, ConfigProvider, theme } from "antd";
import { useTheme } from "next-themes";

/**
 * Ant Design chạy bằng theme của chính nó — **cố ý không map token thương hiệu
 * vào đây**.
 *
 * CMS là công cụ nội bộ, không phải bề mặt thương hiệu: người vận hành ngồi cả
 * ngày với bảng biểu và form, nên thứ đáng giá là giao diện quen thuộc, tương
 * phản rõ và giống hệt tài liệu antd. Bản map cũ (nền paper, primary deep-gold)
 * khiến mọi component antd phải bị phủ class Tailwind mới ra đúng tông, và
 * chính lớp phủ đó là nguồn gốc của cảm giác rối.
 *
 * Phần khai token dưới đây là **ngoại lệ hẹp và có lý do**: nó không đổi hue,
 * chỉ giãn ba bậc nền (trang → thẻ → lớp nổi) cho khớp đúng những giá trị
 * `app/globals.css` đang khai. Hai bên buộc phải khớp bằng tay — token CSS tô
 * cho class Tailwind, thuật toán antd tô cho component antd — và một `Table`
 * nền `#141414` nằm trên một thẻ nền `#1c1c1c` là lỗi thấy ngay. Sửa một bên
 * thì sang bên kia sửa nốt.
 *
 * Vì sao phải giãn: mặc định của antd để nền trang `#f5f5f5` dưới thẻ `#ffffff`
 * (1.05:1), và ở chế độ tối là `#000` dưới `#141414` (1.11:1). Cả hai đều dưới
 * ngưỡng mắt đọc ra ranh giới, nên một trang toàn form đọc ra như một mảng
 * phẳng không có khối nào.
 */
const LIGHT_SURFACES = {
  colorBgLayout: "#eef0f4",
  colorBgContainer: "#ffffff",
  colorBgElevated: "#ffffff",
  colorBorder: "#d0d5dd",
  colorBorderSecondary: "#e4e7ec",
} as const;

const DARK_SURFACES = {
  colorBgLayout: "#141414",
  colorBgContainer: "#1f1f1f",
  colorBgElevated: "#2a2a2a",
  colorBorder: "#3a3a3a",
  colorBorderSecondary: "#303030",
} as const;

export function AntdProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: isDark ? DARK_SURFACES : LIGHT_SURFACES,
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
