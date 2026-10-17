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
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/schema-org";
import { getPublicSettings } from "@/lib/data/settings";
import { LegalDocument, type LegalSection } from "./legal-document";

type Props = {
  locale: Locale;
  dict: Dictionary;
  /** Khoá văn bản — quyết định cả nội dung, phiên bản lẫn danh sách liên quan. */
  documentKey: LegalDocumentKey;
};

/**
 * Khung chung của các trang pháp lý.
 *
 * Các route chỉ khác nhau đúng một chuỗi (`documentKey`), nên bố cục, mục lục,
 * khối phiên bản và danh sách văn bản liên quan viết một lần ở đây. Trước đây
 * hai trang có sẵn chép nguyên bố cục cho nhau, và hệ quả là thêm dòng "Ngày
 * hiệu lực" phải sửa nhiều chỗ.
 *
 * Danh sách liên quan tự dựng: **mọi văn bản khác trừ chính nó**. Không khai
 * tay từng cặp vì một cặp bị quên là một trang pháp lý cụt đường đi.
 */
export async function LegalPage({
  locale,
  dict,
  documentKey,
}: Props) {
  const t = dict.legal[documentKey];
  const shared = dict.legal.shared;
  const meta = LEGAL_DOCUMENTS[documentKey];
  const { messengerUrl } = await getPublicSettings();

  const related = [
    ...(Object.keys(LEGAL_DOCUMENTS) as LegalDocumentKey[])
      .filter((key) => key !== documentKey)
      .map((key) => ({
        label: dict.legal[key].title,
        href: legalHref(locale, key),
      })),
    {
      label: dict.legal.businessInfo.title,
      href: `/${locale}${BUSINESS_INFO_PAGE.path}`,
    },
  ];

  return (
    <>
      {/* "Trang chủ › Điều khoản sử dụng" dưới kết quả tìm kiếm thay vì một URL
          trần. Các trang pháp lý dùng chung khung này nên khai một lần ở đây. */}
      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: t.title, path: LEGAL_DOCUMENTS[documentKey].path },
        ])}
      />
      <SiteHeader
        dict={dict.common}
        locale={locale}
      />
      <main>
        <PageHero eyebrow={shared.eyebrow} title={t.title} subtitle={t.subtitle} />
        <LegalDocument
          versionLabel={shared.versionLabel}
          version={meta.version}
          effectiveLabel={shared.effectiveLabel}
          effectiveDate={formatLegalDate(meta.effectiveDate, locale)}
          updatedLabel={shared.updatedLabel}
          updatedAt={formatLegalDate(meta.updatedAt, locale)}
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
          }}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
