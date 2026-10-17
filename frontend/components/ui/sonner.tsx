"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";

// Icon nằm trong vòng tròn đặc màu theo loại toast (xem app/globals.css), nên
// dùng ký hiệu trần thay vì các icon đã có sẵn viền tròn của lucide.
const GlyphIcon = ({ children }: { children: string }) => (
  <span aria-hidden>{children}</span>
);

const Toaster = ({ ...props }: ToasterProps) => {
  // Website không dùng chế độ "system" (xem `contexts/theme-provider.tsx`), nên
  // giá trị dự phòng trước lúc mount là `dark` — mặc định của trang.
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: <CheckIcon className="size-3.5" strokeWidth={3} />,
        error: <XIcon className="size-3.5" strokeWidth={3} />,
        warning: <GlyphIcon>!</GlyphIcon>,
        info: <GlyphIcon>i</GlyphIcon>,
        loading: <Loader2Icon className="size-3.5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
