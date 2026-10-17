import * as React from "react"

import { cn } from "@/lib/utils"

/** Dùng cho lời mời, lời thông báo nghi lễ và lời cảm ơn. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-20 w-full rounded-lg border border-input bg-transparent px-4 py-3 text-body text-foreground transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
