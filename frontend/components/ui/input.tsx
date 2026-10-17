import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Trạng thái theo design system: default · focus · filled · success · error.
 * - focus  : viền Champagne/Deep Gold (token `ring`).
 * - filled : tự nhận diện qua `:not(:placeholder-shown)`.
 * - success: truyền `data-state="success"`.
 * - error  : truyền `aria-invalid`.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-4 py-2 text-body text-foreground transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-foreground",
        "not-placeholder-shown:border-foreground/35",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "data-[state=success]:border-success",
        "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/25",
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
        "relative w-full [&:has([data-slot=input-affix])_[data-slot=input]]:pr-11",
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
        "pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted-foreground [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

export { Input, InputGroup, InputAffix }
