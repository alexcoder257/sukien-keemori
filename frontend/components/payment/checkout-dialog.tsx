"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import { type Order, type Quote, type VoucherPreview } from "@/apis";
import { VoucherField } from "@/components/payment/voucher-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LEGAL_DOCUMENT_API_TYPE,
  LEGAL_DOCUMENTS,
  legalHref,
  type LegalDocumentKey,
} from "@/constants/legal";
import { useQuoteQuery, useStartCheckout } from "@/hooks/use-order";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatCurrency } from "@/lib/format";

/** Hai văn bản khách chấp thuận ngay lúc mua (ghi vào sổ với `source: checkout`). */
const CHECKOUT_DOCUMENTS = [
  "terms",
  "paymentRefund",
] as const satisfies readonly LegalDocumentKey[];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Có thì thay cho việc chuyển sang màn chuyển khoản — chỗ gọi tự điều hướng. */
  onCheckoutStarted?: (order: Order) => void;
  /** Thiệp cần trả tiền. */
  card: { id: string; title: string };
  dict: Dictionary["payment"]["upgrade"];
  commonDict: Dictionary["common"];
  locale: Locale;
};

/**
 * Hộp thanh toán một thiệp: xem giá, áp mã rồi sang màn chuyển khoản.
 *
 * Giá **luôn hỏi backend**: một con số dựng ở client sẽ lệch với con số chốt
 * vào đơn khi admin vừa đổi bảng giá hay khuyến mãi.
 */
export function CheckoutDialog({
  open,
  onOpenChange,
  onCheckoutStarted,
  card,
  dict,
  commonDict,
  locale,
}: Props) {
  const { data: quote, isPending: quotePending } = useQuoteQuery(open);
  const [voucherPending, setVoucherPending] = useState(false);
  const [voucher, setVoucher] = useState<VoucherPreview | null>(null);
  const [accepted, setAccepted] = useState(false);
  const { start, isPending } = useStartCheckout({
    locale,
    messages: { failed: dict.failed },
    onCreated: onCheckoutStarted,
  });

  const onSubmit = () => {
    void start({
      cardId: card.id,
      voucherCode: voucher?.voucherCode,
      acceptedDocuments: CHECKOUT_DOCUMENTS.map((key) => ({
        type: LEGAL_DOCUMENT_API_TYPE[key],
        version: LEGAL_DOCUMENTS[key].version,
      })),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      {/* Dưới `md` chiếm trọn màn hình, cùng mốc với màn QR của bước sau.
          Không dùng mốc `mobile` (440px): điện thoại lớn rộng hơn mốc đó, và
          hộp nổi giữa màn rồi bước sau lại toàn màn hình là hai ngôn ngữ cho
          cùng một luồng. Nút đẩy xuống đáy, trong tầm ngón cái. */}
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto max-md:inset-0 max-md:h-dvh max-md:max-h-none max-md:w-full max-md:max-w-none max-md:translate-none max-md:rounded-none max-md:bg-background max-md:px-6">
        <DialogHeader>
          <DialogTitle>{dict.title}</DialogTitle>
          <DialogDescription>
            {fill(dict.body, { title: card.title })}
          </DialogDescription>
        </DialogHeader>

        <CheckoutSummary
          quote={quote}
          quotePending={quotePending}
          voucher={voucher}
          onVoucherChange={setVoucher}
          onVoucherPendingChange={setVoucherPending}
          accepted={accepted}
          onAcceptedChange={setAccepted}
          dict={dict}
          locale={locale}
        />

        <DialogFooter className="mt-4 max-md:mt-auto max-md:pt-8 max-md:pb-[env(safe-area-inset-bottom)] max-md:[&>*]:flex-1">
          <DialogClose
            disabled={isPending}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {commonDict.actions.cancel}
          </DialogClose>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isPending || voucherPending || !quote || !accepted}
          >
            {isPending ? dict.submitting : dict.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Phần thân của việc thanh toán: gói, bảng giá, mã giảm giá và ô chấp thuận.
 * State (mã đã áp, ô tích) nằm ở component gọi vì nút gửi đơn cũng nằm ở đó.
 */
function CheckoutSummary({
  quote,
  quotePending,
  voucher,
  onVoucherChange,
  onVoucherPendingChange,
  accepted,
  onAcceptedChange,
  dict,
  locale,
}: {
  quote: Quote | undefined;
  quotePending: boolean;
  voucher: VoucherPreview | null;
  onVoucherChange: (voucher: VoucherPreview | null) => void;
  onVoucherPendingChange: (pending: boolean) => void;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  dict: Dictionary["payment"]["upgrade"];
  locale: Locale;
}) {
  const total = voucher?.amount ?? quote?.amount ?? null;
  const packageDiscount = quote ? quote.listAmount - quote.amount : 0;

  return (
    <>
      <div className="mt-6 rounded-2xl border border-input p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <Landmark aria-hidden className="size-4" />
            {dict.packageName}
          </span>
          {quotePending ? (
            <span className="text-small text-muted-foreground">
              {dict.loading}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-caption text-muted-foreground">{dict.hint}</p>

        {quote ? (
          <dl className="mt-4 space-y-2 text-small">
            <PriceRow
              label={dict.rows.list}
              value={formatCurrency(quote.listAmount, locale)}
            />
            {packageDiscount > 0 ? (
              <PriceRow
                tone="success"
                label={
                  quote.discountPercent
                    ? fill(dict.rows.packageDiscountPercent, {
                        percent: quote.discountPercent,
                      })
                    : dict.rows.packageDiscount
                }
                value={`− ${formatCurrency(packageDiscount, locale)}`}
              />
            ) : null}
            {voucher ? (
              <PriceRow
                tone="success"
                label={fill(dict.rows.voucher, { code: voucher.voucherCode })}
                value={`− ${formatCurrency(voucher.discountAmount, locale)}`}
              />
            ) : null}
            <div className="flex items-baseline justify-between gap-3 border-t border-input pt-3">
              <dt className="font-medium">{dict.rows.total}</dt>
              <dd className="font-heading text-body-lg font-medium">
                {total !== null ? formatCurrency(total, locale) : null}
              </dd>
            </div>
          </dl>
        ) : quotePending ? null : (
          <p role="alert" className="mt-3 text-small text-destructive">
            {dict.quoteFailed}
          </p>
        )}

        <VoucherField
          applied={voucher}
          onApply={onVoucherChange}
          onPendingChange={onVoucherPendingChange}
          dict={dict.voucher}
          locale={locale}
        />
      </div>

      {/* Chấp thuận **tại đúng lúc mua**: `createOrder` ghi phiên bản văn bản
          vào `legal_acceptances` với `source: 'checkout'`. Link mở tab mới:
          rời trang giữa chừng là mất mã giảm giá vừa nhập. */}
      <div className="mt-6 flex items-start gap-3">
        <Checkbox
          id="checkout-consent"
          checked={accepted}
          onCheckedChange={(value) => onAcceptedChange(value === true)}
          className="mt-0.5"
        />
        <label
          htmlFor="checkout-consent"
          className="text-caption leading-relaxed text-muted-foreground"
        >
          {dict.consent.label}{" "}
          <LegalLink locale={locale} documentKey="terms">
            {dict.consent.terms}
          </LegalLink>{" "}
          {dict.consent.and}{" "}
          <LegalLink locale={locale} documentKey="paymentRefund">
            {dict.consent.paymentPolicy}
          </LegalLink>
          .
        </label>
      </div>
    </>
  );
}

function LegalLink({
  locale,
  documentKey,
  children,
}: {
  locale: Locale;
  documentKey: LegalDocumentKey;
  children: React.ReactNode;
}) {
  return (
    <a
      href={legalHref(locale, documentKey)}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-foreground"
    >
      {children}
    </a>
  );
}

function PriceRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div
      className={
        tone === "success"
          ? "flex items-baseline justify-between gap-3 text-success"
          : "flex items-baseline justify-between gap-3"
      }
    >
      <dt className={tone ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
