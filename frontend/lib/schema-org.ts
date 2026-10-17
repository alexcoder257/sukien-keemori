import type { Locale } from "@/i18n/config";
import { BRAND_ASSETS } from "@/constants/brand";
import { LEGAL_CONTACT, LEGAL_ENTITY } from "@/constants/legal";
import { SITE_NAME, SITE_URL, absoluteUrl } from "./seo";

/**
 * Các khối schema.org dùng chung.
 *
 * Tách khỏi component vì đây là **dữ liệu**, không phải giao diện: mỗi hàm nhận
 * dữ liệu thật của trang và trả về một object thuần, nên test được và không có
 * cách nào lệch giữa hai trang cùng loại.
 *
 * Nguyên tắc xuyên suốt: **chỉ khai thứ có thật trên trang**. Google phạt dữ
 * liệu có cấu trúc không khớp nội dung hiển thị, và một khối FAQ khai 10 câu
 * trong khi trang chỉ hiện 5 là đúng định nghĩa của việc đó.
 */

/**
 * Đơn vị chủ quản. Dùng ở trang chủ.
 *
 * `sameAs` là các trang mạng xã hội chính chủ (cấu hình ở CMS, cùng nguồn với
 * hàng biểu tượng ở chân trang). Đó là tín hiệu để Google gộp fanpage, Instagram,
 * TikTok và website thành **một** thực thể thương hiệu — thiếu nó thì tìm
 * "keemori" ra fanpage và các trang con lẫn lộn, không ra trang chủ.
 */
export function organizationSchema(
  sameAs: ReadonlyArray<string | null> = [],
): Record<string, unknown> {
  const profiles = sameAs.filter((url): url is string => Boolean(url));
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    // `@id` cố định để các khối khác trỏ về đây thay vì lặp lại cả object —
    // Google gộp chúng thành một thực thể duy nhất.
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(BRAND_ASSETS.logo.stacked.lightSurface),
    // Chỉ khai những trường **đã có giá trị thật**. Tên pháp nhân, mã số thuế
    // và địa chỉ vẫn đang chờ business cung cấp (`docs/legal-decisions.md`), và
    // khai một địa chỉ bịa trong dữ liệu có cấu trúc còn tệ hơn không khai.
    ...(LEGAL_ENTITY.companyName ? { legalName: LEGAL_ENTITY.companyName } : {}),
    ...(LEGAL_ENTITY.taxCode ? { taxID: LEGAL_ENTITY.taxCode } : {}),
    ...(LEGAL_ENTITY.registeredAddress
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: LEGAL_ENTITY.registeredAddress,
            addressCountry: "VN",
          },
        }
      : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: LEGAL_CONTACT.supportEmail,
      areaServed: "VN",
      availableLanguage: ["vi", "en"],
    },
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
  };
}

/** Website. Đi kèm `Organization` ở trang chủ. */
export function webSiteSchema(locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: absoluteUrl(`/${locale}`),
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/**
 * Chính sản phẩm: một ứng dụng web tạo thiệp mời sự kiện, sinh nhật.
 *
 * Không khai `offers`: thứ đang bán chỉ còn thiệp thiết kế riêng, và trang chủ
 * không in giá nào thành chữ — cùng nguyên tắc "chỉ khai thứ có thật trên
 * trang" ở đầu file. Từng khai giá 0 khi trang chủ còn hứa "Miễn phí để bắt
 * đầu" và còn gói Free.
 */
export function webApplicationSchema(
  locale: Locale,
  description: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#app`,
    name: SITE_NAME,
    url: absoluteUrl(`/${locale}`),
    description,
    inLanguage: locale,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    provider: { "@id": `${SITE_URL}/#organization` },
  };
}

/**
 * Một công cụ miễn phí ở `/cong-cu/*`. Cùng loại `WebApplication` với sản phẩm
 * chính nhưng là thực thể riêng — dùng không cần tài khoản, giá 0 thật sự.
 */
export function toolSchema(input: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
}): Record<string, unknown> {
  const url = absoluteUrl(`/${input.locale}${input.path}`);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#tool`,
    name: input.name,
    description: input.description,
    url,
    inLanguage: input.locale,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
    provider: { "@id": `${SITE_URL}/#organization` },
  };
}

/**
 * Đường dẫn phân cấp, hiện thành "Trang chủ › Mẫu thiệp › …" dưới kết quả tìm
 * kiếm thay vì một URL trần.
 *
 * `items` không kèm trang chủ — hàm tự chèn vì mọi đường dẫn đều bắt đầu từ đó.
 */
export function breadcrumbSchema(
  locale: Locale,
  homeLabel: string,
  items: Array<{ name: string; path: string }>,
): Record<string, unknown> {
  const all = [{ name: homeLabel, path: "" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(`/${locale}${item.path}`),
    })),
  };
}

/**
 * Khối câu hỏi thường gặp — loại schema cho kết quả gập/mở ngay trên trang
 * Google.
 *
 * Điều kiện của Google mà code phải giữ: **mọi câu hỏi khai ở đây phải hiển thị
 * trên chính trang đó**, và câu trả lời phải là văn bản đầy đủ chứ không phải
 * đoạn rút gọn. Vì vậy hàm nhận đúng mảng FAQ mà trang đang render, không nhận
 * một danh sách riêng.
 */
export function faqSchema(
  faqs: Array<{ question: string; answer: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/**
 * Một mẫu thiệp, cho trang `/mau-thiep/<slug>`.
 *
 * `CreativeWork` chứ không phải `Product`: thứ bán ở đây là **gói dịch vụ**,
 * còn mẫu là một thiết kế người dùng chọn. Khai `Product` cho từng mẫu là hứa
 * với Google một trang bán hàng mà trang này không có — không giá, không tồn
 * kho, không nút mua.
 *
 * Không khai `offers`: site này bán thiệp custom theo báo giá, trang mẫu chỉ
 * là cảm hứng và không hiện giá. Bản cũ khai `price: "0"` vì khi đó mẫu tạo
 * miễn phí được — giờ đó là một lời khai sai, và dữ liệu có cấu trúc không
 * khớp nội dung hiển thị đúng là thứ Google phạt (cùng lý do ở đầu file).
 */
export function templateSchema(input: {
  locale: Locale;
  slug: string;
  name: string;
  description: string;
}): Record<string, unknown> {
  const url = absoluteUrl(`/${input.locale}/mau-thiep/${input.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#template`,
    name: input.name,
    description: input.description,
    url,
    // Đúng tấm ảnh trang đang hiện ở khối đầu.
    image: absoluteUrl(`/images/templates/${input.slug}/poster.avif`),
    inLanguage: input.locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    provider: { "@id": `${SITE_URL}/#organization` },
  };
}
