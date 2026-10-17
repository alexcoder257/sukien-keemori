import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import {
  BUSINESS_INFO_PAGE,
  LEGAL_CONTACT,
  LEGAL_DOCUMENTS,
  formatLegalDate,
  legalHref,
  type LegalDocumentKey,
} from "@/constants/legal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getReceivingAccount } from "@/lib/data/payments";
import { getPricing } from "@/lib/data/pricing";
import { getPublicSettings } from "@/lib/data/settings";
import { breadcrumbSchema } from "@/lib/schema-org";
import { formatZaloPhone, zaloHref } from "@/lib/zalo";
import { BusinessOwnerCard } from "./business-owner-card";
import { BusinessPriceList } from "./business-price-list";
import { LegalDocument, type LegalSection } from "./legal-document";

type Props = { locale: Locale; dict: Dictionary };

/** Link sang văn bản pháp lý đặt ngay dưới đoạn nhắc tới nó. */
function DocumentLinks({
  locale,
  dict,
  keys,
}: {
  locale: Locale;
  dict: Dictionary["legal"];
  keys: LegalDocumentKey[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
      {keys.map((key) => (
        <li key={key}>
          <Link
            href={legalHref(locale, key)}
            className="inline-flex items-center gap-1.5 text-small font-medium text-foreground underline decoration-primary underline-offset-4 dark:text-primary dark:no-underline dark:hover:underline"
          >
            {dict[key].title}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Trang Thông tin doanh nghiệp: ai sở hữu website, bán gì, giá bao nhiêu,
 * điều kiện giao dịch, giao nhận và thanh toán ra sao.
 *
 * Dùng chung khung `LegalDocument` với bốn văn bản pháp lý (mục lục, cột đọc,
 * khối liên hệ) nhưng không đi qua `LegalPage`: đây là bản công bố, không có
 * phiên bản hay ngày hiệu lực, và các khối dữ liệu sống (thẻ chủ sở hữu, bảng
 * giá) cắm vào qua `slots`.
 *
 * Trang tĩnh: các nguồn dữ liệu đều qua `serverFetch` có `revalidate`, không có
 * gì đọc request.
 */
export async function BusinessInfoPage({ locale, dict }: Props) {
  const t = dict.legal.businessInfo;
  const shared = dict.legal.shared;

  const [{ messengerUrl, zaloPhone }, account, pricing] = await Promise.all([
    getPublicSettings(),
    getReceivingAccount(),
    getPricing(),
  ]);

  const related = (Object.keys(LEGAL_DOCUMENTS) as LegalDocumentKey[]).map(
    (key) => ({ label: dict.legal[key].title, href: legalHref(locale, key) }),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: t.title, path: BUSINESS_INFO_PAGE.path },
        ])}
      />
      <SiteHeader dict={dict.common} locale={locale} />
      <main>
        <PageHero eyebrow={shared.eyebrow} title={t.title} subtitle={t.subtitle} />
        <LegalDocument
          updatedLabel={shared.updatedLabel}
          updatedAt={formatLegalDate(BUSINESS_INFO_PAGE.updatedAt, locale)}
          tocTitle={shared.tocTitle}
          sections={t.sections as LegalSection[]}
          pendingLabel={shared.pendingLabel}
          relatedTitle={shared.relatedTitle}
          related={related}
          contactChannels={{
            emailLabel: dict.contact.channels.email.title,
            email: LEGAL_CONTACT.supportEmail,
            messengerLabel: dict.contact.channels.fanpage.title,
            messengerValue: dict.contact.channels.fanpage.value,
            messengerUrl,
            zalo: zaloPhone
              ? {
                  label: dict.contact.channels.zalo.title,
                  value: formatZaloPhone(zaloPhone),
                  href: zaloHref(zaloPhone),
                }
              : null,
          }}
          slots={{
            owner: (
              <BusinessOwnerCard
                locale={locale}
                dict={t.owner}
                account={account}
                zaloPhone={zaloPhone}
              />
            ),
            prices: (
              <BusinessPriceList locale={locale} pricing={pricing} dict={t.prices} />
            ),
            transactionLinks: (
              <DocumentLinks
                locale={locale}
                dict={dict.legal}
                keys={["terms", "paymentRefund"]}
              />
            ),
            paymentLinks: (
              <DocumentLinks
                locale={locale}
                dict={dict.legal}
                keys={["paymentRefund"]}
              />
            ),
          }}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
