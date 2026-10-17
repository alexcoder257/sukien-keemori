import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  /* Cỡ chữ KHÔNG khai ở lớp base mà ở từng `size`. Base khai `text-small` rồi
     `size` khai đè là một xung đột chỉ `twMerge` gỡ được, mà `twMerge` chỉ chạy
     khi đi qua `cn()` trong component `Button`. Hơn 60 chỗ trong repo gọi thẳng
     `buttonVariants(...)` cho thẻ `<a>`/`<Link>` — những chỗ đó giữ cả hai class
     và trình duyệt chọn theo thứ tự CSS (`--text-small` khai sau `--text-caption`
     nên `text-small` thắng). Hệ quả: cùng một hàng, nút thật ra 12px còn link ra
     14px. Mỗi size khai đúng một cỡ thì không còn gì để xung đột. */
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Primary / Default — nền Champagne, chữ Forest Ink. */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/85 active:bg-primary/90",
        /* Secondary / Outline — viền mảnh, nền trong suốt.
           Cần `!` vì `border-transparent` ở lớp base xếp sau trong CSS và sẽ
           đè mất màu viền của biến thể này. */
        outline:
          "border-primary/45! text-foreground hover:border-primary! hover:bg-primary/10",
        /* Tertiary / Text — gạch chân mảnh, không nền. */
        ghost:
          "rounded-none border-b border-b-border px-0 text-foreground hover:border-b-primary hover:text-primary",
        /* Nền đặc phụ, dùng trên bề mặt tối. */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/50",
        link: "h-auto p-0 text-primary underline-offset-4 hover:underline",
      },
      /* Vệt sáng quét ngang mặt nút (`btn-shine` trong `globals.css`).
         Là **variant của cva** chứ không phải prop riêng của `Button`: hơn 60
         chỗ trong repo gọi thẳng `buttonVariants(...)` cho `<a>`/`<Link>`, mà
         CTA cần lấp lánh nhất — "Mở thiệp", nút chốt trang giá — đều là link.
         Prop riêng thì những chỗ đó không với tới được.

         Mặc định `none`: hiệu ứng này chỉ đúng khi hiếm. Một trang có ba nút
         cùng lấp lánh thì không nút nào nổi bật. */
      shine: {
        none: "",
        /** Tự quét theo chu kỳ — CTA đứng một mình, cần mời gọi. */
        loop: "btn-shine",
        /** Chỉ quét khi hover/focus — nút nằm trong danh sách hoặc lưới. */
        hover: "btn-shine-hover",
        /** Quét đúng một lần lúc xuất hiện — nút vừa mở ra. */
        once: "btn-shine-once",
      },
      size: {
        sm: "h-9 px-4 text-caption",
        default: "h-11 px-6 text-small",
        lg: "h-13 px-8 text-body",
        icon: "size-11 px-0 text-small",
        "icon-sm": "size-9 px-0 text-caption",
        "icon-lg": "size-13 px-0 text-body",
      },
    },
    compoundVariants: [
      /* Biến thể text bỏ padding ngang ở mọi size. */
      { variant: "ghost", size: "sm", className: "px-0" },
      { variant: "ghost", size: "default", className: "px-0" },
      { variant: "ghost", size: "lg", className: "px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      shine: "none",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  shine = "none",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shine, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
