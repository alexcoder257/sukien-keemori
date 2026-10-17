import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge theo design system. `free` · `gold` · `diamond` là cấp thiết kế của mẫu
 * thiệp (không còn là gói của thiệp), chỉ khác nhau ở sắc độ trong bảng 7 màu.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-lg border px-4 py-1.5 text-small font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        /* Ba bậc là **ba nền đặc**, leo thang theo độ đậm của bảng màu:
           ivory (sáng nhất) → champagne → forest (tối nhất). Đọc được thứ bậc
           chỉ bằng sắc độ, không cần đọc chữ, kể cả khi ba nhãn không đứng
           cạnh nhau.

           Cả ba đều đặc — không bậc nào chỉ có viền — vì nhãn tier xuất hiện
           trên rất nhiều bề mặt (card mẫu, dòng danh sách, thẻ giá nền tối,
           bảng admin). Nhãn nền đặc tự mang theo nền của nó nên ở đâu cũng ra
           đúng một hình dạng; nhãn trong suốt thì đổi diện mạo theo chỗ đứng.

           Chữ hoa + tracking rộng: ở cỡ 12px thì đây là cách rẻ nhất để một
           nhãn nhỏ trông có chủ đích thay vì trông như một mẩu chữ bị bo góc.

           Viền để tách nhãn khỏi bề mặt cùng tông, chứ không để đọc ra là một
           đường kẻ. Free và Gold lấy chính màu nền đậm thêm một nấc. Riêng
           Diamond lấy champagne — cùng màu với chữ, nên trên nền sáng nó thành
           một đường viền kim mảnh quanh mặt lục (đúng ngôn ngữ trang sức), và
           trên nền tối nó là thứ giữ cho nhãn không tan vào nền. */
        free: "rounded-full border-forest-ink/12 bg-ivory text-forest-ink/75 uppercase tracking-[0.14em]",
        gold: "rounded-full border-deep-gold/30 bg-champagne text-forest-ink uppercase tracking-[0.14em]",
        diamond:
          "rounded-full border-champagne/45 bg-forest text-champagne uppercase tracking-[0.14em]",
        outline: "border-border text-foreground",
        solid: "border-transparent bg-primary text-primary-foreground",
      },
      size: {
        xs: "px-2 py-0.5 text-[0.6875rem] leading-4 tracking-[0.1em]",
        sm: "px-3 py-1 text-caption",
        default: "px-4 py-1.5 text-small",
      },
    },
    defaultVariants: {
      variant: "free",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
