"use client"

import * as React from "react"
import { Modal } from "antd"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Composition shadcn-style (Dialog/DialogContent/DialogHeader/...) giữ
 * nguyên như cũ để không phải sửa call site — chỉ đổi cơ chế bên dưới từ
 * Base UI sang antd `Modal`, dùng thuần làm shell (portal/backdrop/focus
 * trap/esc-to-close), còn header/body/footer vẫn tự render bằng markup hiện
 * có thay vì dùng prop `title`/`footer` của antd.
 */
const DialogCloseContext = React.createContext<(() => void) | null>(null)

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const DialogOpenContext = React.createContext(false)

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])
  return (
    <DialogCloseContext.Provider value={close}>
      <DialogOpenContext.Provider value={open}>
        {children}
      </DialogOpenContext.Provider>
    </DialogCloseContext.Provider>
  )
}

/**
 * Nút đóng dialog. Mọi chỗ dùng nó đều là nút "Huỷ" đứng cạnh nút xác nhận,
 * nên nó tự là một `Button` biến thể phụ thay vì bắt call site tự dán class.
 */
function DialogClose({
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const close = React.useContext(DialogCloseContext)
  return (
    <Button
      variant="outline"
      data-slot="dialog-close"
      onClick={(event) => {
        onClick?.(event)
        close?.()
      }}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
}: {
  className?: string
  children: React.ReactNode
  showCloseButton?: boolean
}) {
  const close = React.useContext(DialogCloseContext)
  const open = React.useContext(DialogOpenContext)

  return (
    <Modal
      open={open}
      onCancel={() => close?.()}
      footer={null}
      // Nút đóng, padding và bo góc để nguyên của antd — trước đây phần này tự
      // dựng lại bằng markup riêng nên modal ở CMS không giống modal antd.
      closable={showCloseButton}
      maskClosable
      destroyOnHidden
      className={className}
    >
      <div
        data-slot="dialog-content"
        className="flex max-h-[70svh] flex-col overflow-y-auto overscroll-contain"
      >
        {children}
      </div>
    </Modal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("mb-6 flex flex-col gap-1 pr-8", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      // Cỡ tiêu đề modal của antd: 16px/600.
      className={cn("text-body-lg leading-snug font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
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
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
