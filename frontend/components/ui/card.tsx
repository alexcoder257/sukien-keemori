import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * `tone` đảo bề mặt cục bộ theo design system:
 * - `inherit` (mặc định): đi theo chế độ sáng/tối người dùng đang chọn. Đây là
 *   lựa chọn đúng cho gần như mọi content card — `bg-card` tự ra Ivory ở chế độ
 *   sáng và Forest ở chế độ tối.
 * - `light` : ghim nền sáng, **không** đổi theo chế độ.
 * - `dark`  : ghim nền tối, **không** đổi theo chế độ.
 *
 * Hai giá trị ghim chỉ dành cho chỗ art direction đã chốt một tông và cần giữ
 * tương phản với khối bao quanh nó. Dùng `light` cho một content card thường sẽ
 * để lại một mảng trắng chói giữa trang tối.
 */
function Card({
  className,
  size = "default",
  tone = "inherit",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  tone?: "inherit" | "light" | "dark"
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-tone={tone}
      className={cn(
        // `surface-glass` thay cho `bg-card` + `ring-1`: card nổi lên bằng
        // kính mờ, mép sáng champagne ở cạnh trên và bóng đổ sâu — không phải
        // bằng một bậc nền, vì ba màu tối của hệ chỉ chênh nhau 1.2:1 và bậc
        // nền ở đó là vô hình. Xem `surface-glass` trong `globals.css`.
        "group/card surface-glass flex flex-col gap-(--card-spacing) overflow-hidden rounded-2xl py-(--card-spacing) text-body text-card-foreground",
        "[--card-spacing:--spacing(8)] data-[size=sm]:[--card-spacing:--spacing(6)]",
        "has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        "*:[img:first-child]:rounded-t-2xl *:[img:last-child]:rounded-b-2xl",
        tone === "light" && "theme-paper",
        tone === "dark" && "theme-forest",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-2 rounded-t-2xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-h4 leading-snug font-medium text-balance group-data-[size=sm]/card:text-body-lg",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-small text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-2xl border-t border-border/70 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
