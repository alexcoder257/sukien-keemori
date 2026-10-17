import { Tag } from "antd"

/**
 * Nhãn trạng thái, dựng trên `antd.Tag` với **preset màu của antd** thay vì
 * bảng màu thương hiệu.
 *
 * Ba bậc gói vẫn đọc ra được thứ hạng nhờ màu preset leo thang
 * (xám → vàng → tím), giống cách antd phân biệt trạng thái ở mọi bảng khác
 * trong CMS. Đây là nhãn vận hành, không phải nhãn marketing — bản in đẹp của
 * tier nằm ở trang khách.
 */
type Variant =
  | "free"
  | "gold"
  | "diamond"
  | "outline"
  | "solid"
  | "danger"
  | "warning"
  | "success"

type Size = "xs" | "sm" | "default"

/** `variant` → `color` của antd Tag; `outline` là tag mặc định không màu. */
const COLOR: Record<Variant, string | undefined> = {
  free: "default",
  gold: "gold",
  diamond: "purple",
  // Diamond Song Hỷ — thiệp riêng hai nhà. Đỏ song hỷ ở trang khách; ở CMS lấy
  // preset gần nhất mà không đụng `red` (đã dành cho `danger`).
  outline: undefined,
  solid: "blue",
  // Ba bậc trạng thái, lấy thẳng preset antd theo mục 6 của CLAUDE.md: cần màu
  // thì dùng preset, không thêm hue mới.
  danger: "red",
  warning: "orange",
  success: "green",
}

const SIZE: Record<Size, string> = {
  xs: "text-caption",
  sm: "text-caption",
  default: "text-small",
}

function Badge({
  className,
  variant = "free",
  size = "default",
  ...props
}: Omit<React.ComponentProps<typeof Tag>, "variant" | "color"> & {
  variant?: Variant
  size?: Size
}) {
  return (
    <Tag
      data-slot="badge"
      color={COLOR[variant]}
      className={className ? `${SIZE[size]} ${className}` : SIZE[size]}
      {...props}
    />
  )
}

export { Badge }
