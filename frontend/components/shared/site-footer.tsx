import Link from "next/link";
import { Mail } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { FooterEmailLink } from "@/components/shared/footer-email-link";
import {
  FacebookGlyph,
  InstagramGlyph,
  TiktokGlyph,
  ZaloGlyph,
} from "@/components/shared/social-icons";
import { CONTACT } from "@/constants/contact";
import {
  BUSINESS_INFO_PAGE,
  FOOTER_LEGAL_KEYS,
  legalHref,
} from "@/constants/legal";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/lib/format";
import { getPublicSettings } from "@/lib/data/settings";
import { zaloHref } from "@/lib/zalo";
import { HoverPrefetchLink } from "@/components/shared/hover-prefetch-link";

type Props = { dict: Dictionary["common"]; locale: Locale };

/** Mục chưa có route hiển thị mờ, không phải link (xem `SiteHeader`). */
function FooterItem({ label, href }: { label: string; href: string | null }) {
  return (
    <li>
      {href ? (
        <HoverPrefetchLink
          href={href}
          className="text-small text-muted-foreground transition-colors hover:text-foreground"
        >
          {label}
        </HoverPrefetchLink>
      ) : (
        <span aria-disabled className="text-small text-muted-foreground/50">
          {label}
        </span>
      )}
    </li>
  );
}

/**
 * Chân trang. Async để tự đọc link mạng xã hội từ `site_settings` thay vì bắt
 * 18 trang gọi nó phải truyền thêm một prop: `getPublicSettings` đã cache theo
 * tag (backend xoá tag khi admin bấm Lưu), và Next gộp các lần gọi trùng trong
 * cùng một request — layout gốc cũng đọc nó cho nút chat — nên không phát sinh
 * request thứ hai.
 */
export async function SiteFooter({ dict, locale }: Props) {
  const t = dict.footer;
  const settings = await getPublicSettings();

  // Hàng biểu tượng **luôn hiện đủ năm**, kể cả khi CMS chưa cấu hình. Kênh
  // chưa có link vẫn được vẽ nhưng mờ và không bấm được — cùng lối với
  // `FooterItem` — chứ không dùng `href="#"`, vì bấm vào đó là nhảy lên đầu
  // trang. Email thì luôn bấm được: chưa cấu hình thì rơi về hộp thư hỗ trợ.
  const contactEmail = settings.contactEmail || CONTACT.supportEmail;
  const socials = [
    { key: "facebook", href: settings.facebookUrl, Icon: FacebookGlyph },
    { key: "instagram", href: settings.instagramUrl, Icon: InstagramGlyph },
    { key: "tiktok", href: settings.tiktokUrl, Icon: TiktokGlyph },
    {
      key: "zalo",
      href: settings.zaloPhone ? zaloHref(settings.zaloPhone) : null,
      Icon: ZaloGlyph,
    },
    { key: "email", href: `mailto:${contactEmail}`, Icon: Mail },
  ] as const;
  const socialLinkClass =
    "inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  // Site này là trang phụ của Keemori để đặt **thiệp custom**, nên chân trang
  // chỉ giữ đường đi của việc đó (xem mẫu → xem giá → liên hệ) cộng cột pháp
  // lý. Hướng dẫn, FAQ, công cụ miễn phí và Thiệp của tôi đã gỡ khỏi đây.
  const columns = [
    {
      title: t.linksTitle,
      items: [
        { label: dict.nav.templates, href: `/${locale}/mau-thiep` },
        { label: dict.nav.pricing, href: `/${locale}/bang-gia` },
        { label: t.contact, href: `/${locale}/lien-he` },
      ],
    },
    {
      title: t.legalTitle,
      // Dựng từ `FOOTER_LEGAL_KEYS` chứ không liệt kê tay: thêm một văn bản
      // pháp lý dành cho mọi người mà quên thêm link ở đây thì trang đó không
      // có đường nào tới, và một trang pháp lý không ai tìm thấy thì coi như
      // không tồn tại.
      //
      // Thông tin doanh nghiệp đứng đầu cột: nó không phải văn bản chấp thuận
      // nên không nằm trong `FOOTER_LEGAL_KEYS`, nhưng là thứ khách tra đầu
      // tiên khi cân nhắc có nên chuyển tiền cho một website lạ hay không.
      items: [
        {
          label: t.legalLinks.businessInfo,
          href: `/${locale}${BUSINESS_INFO_PAGE.path}`,
        },
        ...FOOTER_LEGAL_KEYS.map((key) => ({
          label: t.legalLinks[key],
          href: legalHref(locale, key),
        })),
      ],
    },
  ];

  return (
    // `bg-forest-ink` chứ không phải `bg-background` của `.theme-forest`:
    // footer là đáy sâu nhất của trang, phải **thấp hơn** chương ngay trên nó
    // (chương đó cũng là `.theme-forest`, tức Forest). Trước đây hai khối cùng
    // một màu nên chúng dính thành một mảng đen dài không có ranh giới. Token
    // chữ và màu nhấn vẫn lấy từ `.theme-forest`.
    //
    // Vệt sáng champagne ở mép trên là cùng ngôn ngữ "nguồn sáng phía trên" với
    // `surface-glass` — nó vẽ ra đường chân trời giữa nội dung và chân trang.
    <footer
      data-site-footer
      className="theme-forest relative bg-forest-ink text-foreground before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(to_right,transparent,var(--glass-edge-top),transparent)] before:content-['']"
    >
      {/* Hai khối: thương hiệu bên trái, điều hướng gom về nửa phải. Dưới `md`
          khối thương hiệu chiếm trọn hàng đầu và hai cột link đứng cạnh nhau
          bên dưới, để chân trang không dài hơn một khung hình điện thoại. */}
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:gap-8 md:py-20">
        <div className="space-y-5 md:col-span-6 lg:col-span-5">
          {/* Thẻ bao có đúng tỉ lệ **phần có hình** của logo (1352×258 trong tệp
              1600×440), còn ảnh thì tràn ra ngoài đúng bằng phần viền trong
              suốt của tệp. Nhờ vậy mép trái của chữ K thẳng với dòng giới thiệu
              bên dưới và mép trên thẳng với nhãn hai cột link — trước đây viền
              trong suốt đẩy logo thụt vào ~28px so với mọi thứ quanh nó. Phần
              trăm chứ không phải px nên vẫn đúng khi máy hẹp co logo lại. */}
          <Link
            href={`/${locale}`}
            aria-label="Keemori"
            className="relative block aspect-[1352/258] w-full max-w-60"
          >
            <BrandLogo
              alt=""
              surface="dark"
              className="absolute top-[-32.17%] left-[-10.13%] h-[170.54%] w-[118.34%]"
              sizes="300px"
            />
          </Link>
          <p className="max-w-sm text-small text-pretty text-muted-foreground">
            {t.tagline}
          </p>
          {/* Vùng bấm 44px cho ngón tay, nhưng `-ml-2.5` kéo biểu tượng đầu
              tiên về đúng lề trái của dòng giới thiệu phía trên. */}
          <ul
            aria-label={t.socialTitle}
            className="-ml-2.5 flex items-center gap-1"
          >
            {socials.map(({ key, href, Icon }) => (
              <li key={key}>
                {/* So "có chuỗi thật" chứ không so `!== null`: response cũ
                    chưa có trường này (cache, hoặc frontend lên trước backend)
                    cho ra `undefined`, và khi đó phải vẽ bản không bấm được. */}
                {key === "email" ? (
                  // Email mở trình soạn thư **và** sao chép địa chỉ — xem
                  // `FooterEmailLink` về lý do không chỉ dùng `mailto:`.
                  <FooterEmailLink
                    email={contactEmail}
                    label={t.social.email}
                    copiedMessage={fill(t.social.emailCopied, {
                      email: contactEmail,
                    })}
                    copyFailedMessage={fill(t.social.emailCopyFailed, {
                      email: contactEmail,
                    })}
                    className={socialLinkClass}
                  >
                    <Icon aria-hidden className="size-5" />
                  </FooterEmailLink>
                ) : typeof href === "string" && href !== "" ? (
                  <a
                    href={href}
                    aria-label={t.social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={socialLinkClass}
                  >
                    <Icon aria-hidden className="size-5" />
                  </a>
                ) : (
                  <span
                    role="img"
                    aria-label={t.social[key]}
                    className="inline-flex size-11 items-center justify-center text-muted-foreground/50"
                  >
                    <Icon aria-hidden className="size-5" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 md:col-span-6 lg:col-span-5 lg:col-start-8">
          {columns.map((column) => (
            <div key={column.title} className="space-y-4">
              <p className="text-eyebrow text-primary">{column.title}</p>
              <ul className="space-y-3">
                {column.items.map((item) => (
                  <FooterItem
                    key={item.label}
                    label={item.label}
                    href={item.href}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <p className="container-page py-6 text-caption text-muted-foreground">
          {fill(t.copyright, { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
