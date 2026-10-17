"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, TicketPercent } from "lucide-react";
import { ApiError, type CheckoutVoucher, type VoucherPreview } from "@/apis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreviewVoucherMutation } from "@/hooks/use-order";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatCurrency } from "@/lib/format";
import styles from "./voucher-field.module.css";

type VoucherDictionary = Dictionary["payment"]["upgrade"]["voucher"];

/** Một mã khách vừa gõ tay và đã được backend xác nhận — dựng thành vé như mã trong danh sách. */
function ticketFromPreview(preview: VoucherPreview): CheckoutVoucher {
  return {
    code: preview.voucherCode,
    description: null,
    discountType: "amount",
    discountValue: preview.discountAmount,
    discountAmount: preview.discountAmount,
    available: true,
  };
}

export function VoucherPicker({
  applied,
  available,
  loading,
  loadError,
  onRetry,
  onApply,
  onPendingChange,
  onClose,
  title,
  dict,
  locale,
}: {
  applied: VoucherPreview | null;
  available: CheckoutVoucher[];
  loading: boolean;
  loadError: boolean;
  onRetry: () => void;
  onApply: (voucher: VoucherPreview | null) => void;
  onPendingChange: (pending: boolean) => void;
  onClose: () => void;
  title: ReactNode;
  dict: VoucherDictionary;
  locale: Locale;
}) {
  const [code, setCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(
    applied?.voucherCode ?? null,
  );
  const [manual, setManual] = useState<VoucherPreview | null>(applied);
  const [error, setError] = useState<string | null>(null);
  const preview = usePreviewVoucherMutation();
  const groupName = useId();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      onPendingChange(false);
    };
  }, [onPendingChange]);

  const eligible: CheckoutVoucher[] = available.filter(
    (voucher) => voucher.available,
  );
  if (manual && !available.some((voucher) => voucher.code === manual.voucherCode))
    eligible.unshift(ticketFromPreview(manual));
  const unavailable = available.filter((voucher) => !voucher.available);
  const selected =
    eligible.find((voucher) => voucher.code === selectedCode) ?? null;

  const verify = (value: string, confirm: boolean) => {
    if (!value.trim() || preview.isPending) return;
    setError(null);
    onPendingChange(true);
    preview.mutate(
      value.trim(),
      {
        onSuccess: (result) => {
          if (!alive.current) return;
          if (confirm) {
            onApply(result);
            onClose();
          } else {
            setManual(result);
            setSelectedCode(result.voucherCode);
            setCode("");
          }
        },
        onError: (cause) => {
          if (!alive.current) return;
          setError(cause instanceof ApiError ? cause.message : dict.failed);
          onRetry();
        },
        onSettled: () => {
          if (alive.current) onPendingChange(false);
        },
      },
    );
  };
  const confirm = () => {
    if (selected) verify(selected.code, true);
    else {
      onApply(null);
      onClose();
    }
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={dict.back}
          onClick={onClose}
        >
          <ArrowLeft aria-hidden className="size-5" />
        </Button>
        {title}
      </div>
      <div className="shrink-0 space-y-2 border-b border-border px-4 py-4">
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                verify(code, false);
              }
            }}
            aria-label={dict.label}
            placeholder={dict.placeholder}
            disabled={preview.isPending}
            className="min-w-0 flex-1 uppercase"
          />
          <Button
            type="button"
            variant="outline"
            disabled={!code.trim() || preview.isPending}
            onClick={() => verify(code, false)}
          >
            {preview.isPending && code.trim() ? dict.applying : dict.apply}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-caption text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        data-lenis-prevent
      >
        {loading ? (
          <p className="text-small text-muted-foreground" role="status">
            {dict.loading}
          </p>
        ) : loadError ? (
          <div className="flex items-center justify-between gap-3 text-small text-muted-foreground">
            <span>{dict.listFailed}</span>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {dict.retry}
            </Button>
          </div>
        ) : (
          <>
            {eligible.length ? (
              <section aria-label={dict.eligibleTitle}>
                <h3 className="mb-3 text-small font-medium">
                  {dict.eligibleTitle}
                </h3>
                <div
                  role="radiogroup"
                  aria-label={dict.eligibleTitle}
                  className="space-y-3"
                >
                  {eligible.map((voucher) => (
                    <VoucherTicket
                      key={voucher.code}
                      voucher={voucher}
                      selected={selected?.code === voucher.code}
                      onSelect={() => setSelectedCode(voucher.code)}
                      disabled={preview.isPending}
                      dict={dict}
                      locale={locale}
                      groupName={groupName}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <p className="text-small leading-relaxed text-muted-foreground">
                {dict.empty}
              </p>
            )}
            {unavailable.length ? (
              <section className="mt-6" aria-label={dict.unavailableTitle}>
                <h3 className="mb-3 text-small font-medium text-muted-foreground">
                  {dict.unavailableTitle}
                </h3>
                <div className="space-y-3">
                  {unavailable.map((voucher) => (
                    <VoucherTicket
                      key={voucher.code}
                      voucher={voucher}
                      selected={false}
                      disabled
                      dict={dict}
                      locale={locale}
                      groupName={groupName}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
      <div className="shrink-0 space-y-3 border-t border-border bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="text-small">
            <p className="text-muted-foreground">
              {selected
                ? fill(dict.selectedCount, { count: 1 })
                : dict.noneSelected}
            </p>
            {selected ? (
              <p className="mt-1 font-medium text-success">
                {fill(dict.selectedSaving, {
                  amount: formatCurrency(selected.discountAmount, locale),
                })}
              </p>
            ) : null}
          </div>
          {selected ? (
            <Button
              type="button"
              variant="link"
              className="ml-auto h-auto shrink-0 p-0 text-right text-caption whitespace-nowrap"
              disabled={preview.isPending}
              onClick={() => setSelectedCode(null)}
            >
              {dict.clearSelection}
            </Button>
          ) : null}
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={preview.isPending}
          onClick={confirm}
        >
          {preview.isPending ? dict.applying : dict.confirm}
        </Button>
      </div>
    </>
  );
}

function VoucherTicket({
  voucher,
  selected,
  onSelect,
  disabled,
  dict,
  locale,
  groupName,
}: {
  voucher: CheckoutVoucher;
  selected: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  dict: VoucherDictionary;
  locale: Locale;
  groupName: string;
}) {
  const unavailable = !voucher.available;
  const reason = unavailableReason(voucher, dict, locale);
  const terms = [
    voucher.description,
    voucher.expiresAt
      ? fill(dict.expires, {
          date: new Date(voucher.expiresAt).toLocaleString(
            locale === "vi" ? "vi-VN" : "en-US",
            { dateStyle: "short", timeStyle: "short" },
          ),
        })
      : null,
  ].filter(Boolean);
  return (
    <div
      className={`${styles.ticket} ${selected ? styles.selected : ""} ${unavailable ? styles.unavailable : ""}`}
    >
      <label className={styles.ticketChoice}>
        <input
          type="radio"
          name={groupName}
          checked={selected}
          aria-label={fill(dict.selectCode, { code: voucher.code })}
          disabled={disabled || unavailable}
          onChange={onSelect}
          className="sr-only"
        />
        <span className={styles.ticketOffer}>
          <TicketPercent aria-hidden className="size-6" />
          <span className="text-small font-semibold [overflow-wrap:anywhere]">
            {voucher.code}
          </span>
        </span>
        <span className={styles.ticketDetails}>
          <span className="flex items-center justify-between gap-3">
            <span className="text-body font-semibold text-primary tabular-nums">
              {fill(dict.save, {
                amount: formatCurrency(voucher.discountAmount, locale),
              })}
            </span>
            <span
              aria-hidden
              className={`${styles.radio} ${selected ? styles.radioSelected : ""}`}
            >
              {selected ? <Check className="size-3.5" /> : null}
            </span>
          </span>
          {terms.length ? (
            <span className="mt-2 block text-caption leading-relaxed text-muted-foreground">
              {terms.join(" · ")}
            </span>
          ) : null}
        </span>
      </label>
      {unavailable && reason ? (
        <p className="border-t border-dashed border-border px-4 py-2 text-caption text-muted-foreground">
          {reason}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Backend trả **mã** lý do (`minimum`, `user-limit`) chứ không trả câu chữ —
 * câu chữ nằm ở từ điển. Mã lạ (backend thêm loại mới trước frontend) thì hỏng
 * mềm về câu chung thay vì in nguyên mã ra cho khách.
 */
function unavailableReason(
  voucher: CheckoutVoucher,
  dict: VoucherDictionary,
  locale: Locale,
): string | null {
  if (voucher.available || !voucher.reason) return null;
  switch (voucher.reason) {
    case "minimum":
      return voucher.minAmount
        ? fill(dict.reasons.minimum, {
            amount: formatCurrency(voucher.minAmount, locale),
          })
        : dict.reasons.unavailable;
    case "user-limit":
      return dict.reasons.userLimit;
    default:
      return dict.reasons.unavailable;
  }
}
