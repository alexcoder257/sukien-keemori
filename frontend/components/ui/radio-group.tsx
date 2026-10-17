"use client"

import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-4", className)}
      {...props}
    />
  )
}

function Radio({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio"
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-full border border-input transition-colors outline-none",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "hover:border-primary/70",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-40 group-has-disabled/field:opacity-40",
        "aria-invalid:border-destructive",
        "data-checked:border-primary",
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-indicator"
        className="size-2.5 rounded-full bg-primary data-unchecked:hidden"
      />
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, Radio }
