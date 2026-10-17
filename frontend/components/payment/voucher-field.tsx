"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronRight, TicketPercent } from "lucide-react";
import type { VoucherPreview } from "@/apis";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAvailableVouchersQuery } from "@/hooks/use-order";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatCurrency } from "@/lib/format";
import { VoucherPicker } from "./voucher-picker";

/**
 * Dòng "Mã giảm giá" trong hộp thanh toán, mở màn chọn mã: hộp nằm giữa, phủ
 * đúng kích thước hộp thanh toán bên dưới trên desktop, toàn màn hình trên điện
 * thoại (`max-mobile:`).
 */
export function VoucherField({
  applied,
  onApply,
  onPendingChange,
  dict,
  locale,
}: {
  applied: VoucherPreview | null;
  onApply: (voucher: VoucherPreview | null) => void;
  onPendingChange: (pending: boolean) => void;
  dict: Dictionary["payment"]["upgrade"]["voucher"];
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [parentSize, setParentSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const available = useAvailableVouchersQuery();

  const onOpenChange = (value: boolean) => {
    if (value) {
      const parent = triggerRef.current?.closest(
        '[data-slot="dialog-content"]',
      );
      const bounds = parent?.getBoundingClientRect();
      setParentSize(
        bounds ? { width: bounds.width, height: bounds.height } : null,
      );
    }
    setOpen(value);
    if (value) void available.refetch();
  };

  useEffect(() => {
    if (!open) return;
    const parent = triggerRef.current?.closest('[data-slot="dialog-content"]');
    if (!parent) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = parent.getBoundingClientRect();
      setParentSize({ width, height });
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, [open]);

  const triggerProps = {
    className:
      "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-1 text-left text-small transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    children: (
      <>
        <span className="flex min-w-0 items-center gap-2">
          <TicketPercent aria-hidden className="size-5 shrink-0 text-primary" />
          {fill(dict.available, {
            count: available.isPending
              ? "…"
              : (available.data?.filter((voucher) => voucher.available)
                  .length ?? 0),
          })}
        </span>
        <span className="flex max-w-[45%] items-center gap-2">
          {applied ? (
            <span className="min-w-0 rounded-sm border border-success/40 bg-success/10 px-2 py-1 text-caption text-success break-all">
              {fill(dict.applied, {
                amount: formatCurrency(applied.discountAmount, locale),
              })}
            </span>
          ) : null}
          <ChevronRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
        </span>
      </>
    ),
  };

  return (
    <div className="mt-4 border-t border-input pt-2">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger ref={triggerRef} {...triggerProps} />
        <DialogContent
          showCloseButton={false}
          forceBackdrop
          backdropClassName="z-[60]"
          style={
            {
              backgroundColor: "var(--background)",
              "--voucher-dialog-width": parentSize
                ? `${parentSize.width}px`
                : "min(32rem,calc(100vw - 2rem))",
              "--voucher-dialog-height": parentSize
                ? `${parentSize.height}px`
                : "min(40rem,90dvh)",
            } as CSSProperties
          }
          className="z-[60] h-[var(--voucher-dialog-height)] max-h-[90dvh] w-[var(--voucher-dialog-width)] max-w-none gap-0 overflow-hidden p-0 max-mobile:inset-0 max-mobile:h-dvh max-mobile:max-h-none max-mobile:w-full max-mobile:translate-none max-mobile:rounded-none"
        >
          {open ? (
            <VoucherPicker
              applied={applied}
              available={available.data ?? []}
              loading={available.isPending}
              loadError={available.isError}
              onRetry={() => void available.refetch()}
              onApply={onApply}
              onPendingChange={onPendingChange}
              onClose={() => setOpen(false)}
              title={
                <DialogTitle className="text-body font-medium">
                  {dict.pickerTitle}
                </DialogTitle>
              }
              dict={dict}
              locale={locale}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
