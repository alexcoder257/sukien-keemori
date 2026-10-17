import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/* Thang cỡ chữ của design system (xem `--text-*` trong `app/globals.css`).
   tailwind-merge chỉ biết thang mặc định của Tailwind, nên `text-body` hay
   `text-small` bị nó xếp nhầm vào nhóm màu chữ và triệt tiêu
   `text-primary-foreground` đứng trước — nút `size="lg"` mất luôn màu chữ và
   rơi về màu chữ kế thừa. Khai báo lại nhóm `font-size` để nó phân biệt đúng
   cỡ chữ với màu chữ. */
const FONT_SIZES = [
  "caption",
  "small",
  "body",
  "body-lg",
  "h4",
  "h3",
  "h2",
  "h1",
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
