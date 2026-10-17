import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Dùng cho lời mời, lời thông báo nghi lễ và lời cảm ơn.
 *
 * Là `<textarea>` thuần vì cùng lý do với `input.tsx`: antd `Input.TextArea`
 * giữ state nội bộ nên không hiện được defaultValues/reset của RHF
 * `register()`.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-16 w-full rounded-md border border-input bg-card px-3 py-1 text-body text-foreground transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "hover:border-primary",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/10",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
