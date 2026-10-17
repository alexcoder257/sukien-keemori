"use client"

import { cn } from "@/lib/utils"

export interface SegmentedOption<Value extends string> {
  value: Value
  label: React.ReactNode
}

/**
 * Nhóm 2–3 lựa chọn loại trừ nhau, hiển thị cạnh nhau: Chỉnh sửa ⇄ Xem thiệp,
 * Desktop ⇄ Mobile.
 */
function SegmentedControl<Value extends string>({
  options,
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel,
}: {
  options: SegmentedOption<Value>[]
  value: Value
  onValueChange: (value: Value) => void
  className?: string
  "aria-label": string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      data-slot="segmented-control"
      // Rãnh chìm thay vì khung viền: control này luôn đứng cạnh nút hành động
      // chính, nếu nó cũng có viền/nền đậm thì hai thứ tranh nhau cùng một mức
      // nhấn mạnh.
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-foreground/6 p-1",
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              // Cao 28px + 4px đệm mỗi bên của rãnh = 36px, đúng bằng `Button`
              // size `sm` đứng cạnh nó.
              "inline-flex h-7 items-center gap-2 rounded-sm px-4 text-small transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/40",
              // Ô đang chọn nổi lên bằng bề mặt sáng + bóng đổ, không bằng màu
              // thương hiệu: màu đó dành riêng cho nút hành động chính.
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
