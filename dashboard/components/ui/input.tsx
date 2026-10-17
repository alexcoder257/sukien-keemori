import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Cố ý là `<input>` thuần chứ không bọc antd `Input`: antd giữ state nội bộ
 * (controlled) nên `register()` của React Hook Form — vốn ghi giá trị thẳng
 * vào DOM ref theo kiểu uncontrolled — không hiện được defaultValues/reset.
 *
 * Vì vậy class dưới đây **chép lại diện mạo mặc định của `antd.Input`** (cao
 * 32px, bo 6px, viền `#d9d9d9`, focus đổi viền + quầng xanh nhạt) để nó đứng
 * cạnh `Select`, `Button` của antd mà không lệch. Sửa gì ở đây thì đối chiếu
 * với một `antd.Input` thật, đừng phát minh cỡ mới.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-body text-foreground transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-small file:text-foreground",
        "hover:border-primary",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground",
        "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/10",
        className
      )}
      {...props}
    />
  )
}

/**
 * Bọc input để đặt icon trạng thái ở cạnh phải (check khi success,
 * dấu x khi error) như trong design system.
 */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "relative w-full [&:has([data-slot=input-affix])_[data-slot=input]]:pr-9",
        className
      )}
      {...props}
    />
  )
}

function InputAffix({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-affix"
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

export { Input, InputGroup, InputAffix }
