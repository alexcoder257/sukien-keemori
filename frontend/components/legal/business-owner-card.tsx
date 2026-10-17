import type { ReactNode } from "react";
import { BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { findBankByCode } from "@/constants/banks";
import { LEGAL_CONTACT, LEGAL_ENTITY, formatLegalDate } from "@/constants/legal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ReceivingAccount } from "@/lib/data/payments";
import { fill } from "@/lib/format";
import { formatZaloPhone, zaloHref } from "@/lib/zalo";

type Props = {
  locale: Locale;
  dict: Dictionary["legal"]["businessInfo"]["owner"];
  account: ReceivingAccount | null;
  /** Từ `site_settings` — cùng nguồn với chân trang và trang Liên hệ. */
  zaloPhone: string | null;
};

/**
 * Thẻ "Chủ sở hữu website" ở đầu trang Thông tin doanh nghiệp.
 *
 * Mỗi dòng chỉ hiện khi có giá trị thật — trường `null` trong `LEGAL_ENTITY`
 * là **chưa có**, và một dòng "Mã số thuế: —" đọc ra như đang giấu thông tin.
 * Tài khoản nhận tiền đọc từ backend nên luôn trùng tài khoản trong QR.
 */
export function BusinessOwnerCard({
  locale,
  dict,
  account,
  zaloPhone,
}: Props) {
  const bank = account ? findBankByCode(account.bankCode) : undefined;

  const rows: Array<{ label: string; value: ReactNode }> = [];
  const push = (label: string, value: ReactNode | null) => {
    if (value) rows.push({ label, value });
  };

  push(dict.fields.businessName, LEGAL_ENTITY.businessName);
  push(
    dict.fields.taxCode,
    LEGAL_ENTITY.taxCode ? (
      <span className="tabular-nums">{LEGAL_ENTITY.taxCode}</span>
    ) : null,
  );
  push(
    dict.fields.registeredAt,
    LEGAL_ENTITY.registeredAt ? (
      <span className="tabular-nums">
        {formatLegalDate(LEGAL_ENTITY.registeredAt, locale)}
      </span>
    ) : null,
  );
  push(dict.fields.registrationAuthority, LEGAL_ENTITY.registrationAuthority);
  push(dict.fields.registeredAddress, LEGAL_ENTITY.registeredAddress);
  push(dict.fields.legalRepresentative, LEGAL_ENTITY.legalRepresentative);
  push(
    dict.fields.email,
    <a
      href={`mailto:${LEGAL_CONTACT.supportEmail}`}
      className="underline decoration-primary underline-offset-4 transition-colors dark:hover:text-primary"
    >
      {LEGAL_CONTACT.supportEmail}
    </a>,
  );
  push(
    dict.fields.zalo,
    zaloPhone ? (
      <a
        href={zaloHref(zaloPhone)}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-primary underline-offset-4 tabular-nums transition-colors dark:hover:text-primary"
      >
        {formatZaloPhone(zaloPhone)}
      </a>
    ) : null,
  );
  push(
    dict.fields.paymentAccount,
    account ? (
      <span className="block space-y-0.5">
        <span className="block">
          {bank ? `${bank.shortName} — ${bank.name}` : account.bankCode}
        </span>
        <span className="block text-body-lg font-semibold tracking-wide text-foreground tabular-nums dark:text-primary">
          {account.accountNumber}
        </span>
        {account.accountName ? (
          <span className="block text-small text-muted-foreground">
            {fill(dict.accountHolder, { name: account.accountName })}
          </span>
        ) : null}
      </span>
    ) : null,
  );

  return (
    <Card className="gap-6 px-6 sm:px-8">
      <div>
        {/* Vàng chỉ ở nền tối: ở nền sáng `--primary` là Champagne, màu của
            nút, đặt làm chữ trên giấy chỉ còn ~1.3:1. Cùng quy ước với thẻ
            giá ở `custom-card-offer.tsx`. */}
        <p className="text-eyebrow text-foreground dark:text-primary">
          {dict.eyebrow}
        </p>
        <p className="mt-3 font-editorial text-h4 leading-snug font-medium tracking-[-0.02em] text-balance">
          {LEGAL_ENTITY.companyName ?? LEGAL_ENTITY.businessName}
        </p>
      </div>

      <dl className="divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"
          >
            <dt className="text-small text-muted-foreground">{row.label}</dt>
            <dd className="text-body text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>

      {LEGAL_ENTITY.moitNotificationUrl ? (
        <a
          href={LEGAL_ENTITY.moitNotificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-primary px-4 py-2 text-small font-medium text-foreground transition-colors hover:bg-primary/10 dark:text-primary"
        >
          <BadgeCheck aria-hidden className="size-4" />
          {dict.moitBadge}
        </a>
      ) : null}
    </Card>
  );
}
