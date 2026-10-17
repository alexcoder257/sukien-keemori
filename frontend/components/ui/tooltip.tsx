"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider(props: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider {...props} />
}

function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * Nhãn ngắn cho nút chỉ có icon. Bong bóng đảo tông (`bg-foreground` /
 * `text-background`) cùng ngôn ngữ với bong bóng chữ của nút Messenger: nó là
 * một nhãn nổi, không phải một bề mặt, nên không dùng kính như Popover.
 *
 * `z-[60]` trên Positioner vì tooltip hay nằm **trong** dialog (`z-50`); cùng
 * z-index thì thứ tự portal quyết định, và đó không phải thứ nên phó mặc.
 */
function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "side" | "sideOffset" | "align">) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className="isolate z-[60]"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "origin-(--transform-origin) rounded-md bg-foreground px-2.5 py-1.5 text-caption font-medium whitespace-nowrap text-background shadow-md shadow-black/20 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
