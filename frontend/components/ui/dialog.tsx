"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  /** Đổi lớp nền mờ — dialog xem ảnh cần nền tối hơn dialog thường. */
  backdropClassName?: string
  /** Render lớp nền riêng khi modal này nằm trong một modal khác. */
  forceBackdrop?: boolean
}) {
  const { showCloseButton = true, backdropClassName, forceBackdrop, ...popupProps } = props

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        forceRender={forceBackdrop}
        data-slot="dialog-backdrop"
        // Scrim 55% + blur nhẹ: dưới 40% thì nội dung phía sau vẫn tranh chỗ
        // với hộp thoại, mà hộp thoại giờ là kính trong nên nó cần một nền tối
        // thật sự để chữ bám vào. Blur ở đây còn là *tín hiệu*: nền mờ đi nghĩa
        // là bấm ra ngoài sẽ đóng.
        className={cn(
          "fixed inset-0 z-50 bg-forest-ink/55 backdrop-blur-sm",
          backdropClassName,
        )}
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-lenis-prevent
        className={cn(
          "surface-glass-strong fixed top-1/2 left-1/2 z-50 flex max-h-[90svh] w-[calc(100%-2rem)] max-w-lg -translate-1/2 flex-col overflow-y-auto overscroll-contain rounded-2xl p-8 text-card-foreground outline-none",
          className
        )}
        {...popupProps}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-6 right-6 rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("mb-6 flex flex-col gap-2 pr-8", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-h4 leading-snug font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-small text-muted-foreground", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("mt-8 flex flex-wrap justify-end gap-3", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
