import { Button as AntButton } from "antd"

import { cn } from "@/lib/utils"

/**
 * Bọc mỏng `antd.Button`: giữ nguyên API `variant`/`size` để call site không
 * phải sửa, nhưng **không tô màu gì thêm** — mỗi biến thể chỉ là một tổ hợp
 * prop có sẵn của antd, nên nút ở CMS trông đúng như nút trong tài liệu antd.
 */
type Variant =
  | "default"
  | "outline"
  | "ghost"
  | "secondary"
  | "destructive"
  | "link"

type Size = "sm" | "default" | "lg" | "icon" | "icon-sm" | "icon-lg"

/** `variant` của mình → `type`/`danger` của antd. */
const VARIANT: Record<
  Variant,
  { type: "primary" | "default" | "text" | "link"; danger?: boolean }
> = {
  default: { type: "primary" },
  outline: { type: "default" },
  ghost: { type: "text" },
  secondary: { type: "default" },
  destructive: { type: "primary", danger: true },
  link: { type: "link" },
}

/** antd chỉ có 3 cỡ; `lg` gộp vào `large`, các cỡ icon dùng thêm `shape`. */
const SIZE: Record<Size, "small" | "middle" | "large"> = {
  sm: "small",
  default: "middle",
  lg: "large",
  icon: "middle",
  "icon-sm": "small",
  "icon-lg": "large",
}

type ButtonProps = Omit<
  React.ComponentProps<typeof AntButton>,
  "type" | "variant" | "size"
> & {
  variant?: Variant
  size?: Size
  /** `type` HTML gốc (button/submit/reset) — KHÔNG phải `type` biến thể của antd. */
  type?: "button" | "submit" | "reset"
}

function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  const isIcon = size.startsWith("icon")

  return (
    <AntButton
      data-slot="button"
      htmlType={type}
      size={SIZE[size]}
      shape={isIcon ? "circle" : "default"}
      className={cn("inline-flex items-center justify-center gap-2", className)}
      {...VARIANT[variant]}
      {...props}
    />
  )
}

export { Button }
