import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { ZaloGlyph } from "@/components/shared/social-icons";
import { toLegalBlocks } from "./legal-blocks";

export type LegalSection = {
  heading: string;
  /**
   * Đoạn văn, theo thứ tự. Dòng bắt đầu bằng `- ` là một gạch đầu dòng: các
   * dòng liền nhau gộp thành một danh sách.
   *
   * Đánh dấu bằng tiền tố thay vì thêm một khoá `list` riêng vì dictionary là
   * JSON và người dịch làm việc trực tiếp trên nó — một mảng chuỗi phẳng giữ
   * cho hai bản `vi`/`en` không bao giờ lệch cấu trúc.
   */
  body: string[];
  /**
   * Mục có nội dung **chưa được business chốt** (hoàn tiền, thời gian lưu trữ,
   * hạn dùng Credits). Hiện một khối cảnh báo thay vì một quy định bịa ra.
   * Xem `docs/legal-decisions.md`.
   */
  pending?: boolean;
  /** Hiện hai đầu mối thật của sản phẩm ngay trong mục liên hệ. */
  contact?: boolean;
  /**
   * Khoá của một khối dựng sẵn mà trang truyền vào qua `slots` — thẻ thông tin
   * chủ sở hữu, bảng giá. Chữ vẫn nằm ở `body`; khe chỉ chứa thứ không viết
   * được thành câu trong JSON (dữ liệu sống, bảng, link).
   */
  slot?: string;
};

type RelatedLink = { label: string; href: string };

type ContactChannels = {
  emailLabel: string;
  email: string;
  messengerLabel: string;
  messengerValue: string;
  messengerUrl: string | null;
  /**
   * Thẻ Zalo — chỉ trang nào **chữ** của mục liên hệ có nhắc Zalo mới truyền.
   * Các văn bản có phiên bản đang ghi đúng hai kênh email + Messenger; thêm
   * thẻ thứ ba dưới câu đó là để trang tự nói hai điều khác nhau.
   */
  zalo?: { label: string; value: string; href: string } | null;
};

type Props = {
  /**
   * Phiên bản và ngày hiệu lực chỉ có ở văn bản người dùng chấp thuận. Trang
   * công bố (Thông tin doanh nghiệp) bỏ trống, chỉ còn ngày cập nhật.
   */
  versionLabel?: string;
  version?: string;
  effectiveLabel?: string;
  effectiveDate?: string;
  updatedLabel: string;
  updatedAt: string;
  tocTitle: string;
  sections: LegalSection[];
  /** Nhãn của khối cảnh báo ở các mục `pending`. */
  pendingLabel: string;
  relatedTitle: string;
  related: RelatedLink[];
  contactChannels: ContactChannels;
  /** Nội dung cho các mục khai `slot`, theo khoá. */
  slots?: Record<string, ReactNode>;
};

/** Bỏ số thứ tự đầu đề ("3. Các gói dịch vụ" → "cac-goi-dich-vu") làm id neo. */
function anchorId(heading: string): string {
  return heading
    .replace(/^\d+\.\s*/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Bố cục chung cho trang văn bản pháp lý: mục lục dính bên trái, nội dung ở cột
 * hẹp bên phải. Nội dung do dictionary cung cấp nên hai locale luôn cùng cấu
 * trúc; component này không chứa chữ cứng nào.
 *
 * Server Component — trang pháp lý không có tương tác.
 */
export function LegalDocument({
  versionLabel,
  version,
  effectiveLabel,
  effectiveDate,
  updatedLabel,
  updatedAt,
  tocTitle,
  sections,
  pendingLabel,
  relatedTitle,
  related,
  contactChannels,
  slots,
}: Props) {
  return (
    <div className="container-page grid gap-12 py-16 lg:grid-cols-[16rem_1fr] lg:gap-16 lg:py-20">
      <nav aria-label={tocTitle} className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-eyebrow text-primary">{tocTitle}</p>
        <ol className="mt-5 space-y-2">
          {sections.map((section) => (
            <li key={section.heading}>
              <a
                href={`#${anchorId(section.heading)}`}
                className="text-small text-muted-foreground transition-colors hover:text-foreground"
              >
                {section.heading}
              </a>
            </li>
          ))}
        </ol>

        {related.length > 0 ? (
          <div className="mt-10 border-t border-border pt-6">
            <p className="text-eyebrow text-primary">{relatedTitle}</p>
            <ul className="mt-5 space-y-2">
              {related.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      <div className="max-w-2xl">
        {/* Ba mốc đứng cạnh nhau vì chúng trả lời ba câu khác nhau: bản nào,
            áp dụng từ bao giờ, sửa lần cuối lúc nào. */}
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-small text-muted-foreground">
          {version ? (
            <div className="flex gap-2">
              <dt>{versionLabel}:</dt>
              <dd className="tabular-nums text-foreground">{version}</dd>
            </div>
          ) : null}
          {effectiveDate ? (
            <div className="flex gap-2">
              <dt>{effectiveLabel}:</dt>
              <dd className="tabular-nums">{effectiveDate}</dd>
            </div>
          ) : null}
          <div className="flex gap-2">
            <dt>{updatedLabel}:</dt>
            <dd className="tabular-nums">{updatedAt}</dd>
          </div>
        </dl>

        <div className="mt-10 space-y-12">
          {sections.map((section) => (
            <section
              key={section.heading}
              id={anchorId(section.heading)}
              // Neo từ mục lục không được chui xuống dưới header dính.
              className="scroll-mt-28"
            >
              <h2 className="font-heading text-h4 leading-snug font-medium">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.pending ? (
                  <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-small text-foreground">
                    {pendingLabel}
                  </p>
                ) : null}
                {toLegalBlocks(section.body).map((block, index) =>
                  block.kind === "ul" ? (
                    <ul
                      key={`ul-${index}`}
                      className="list-disc space-y-2 pl-5 text-body text-muted-foreground"
                    >
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      key={block.text}
                      className="text-body text-muted-foreground"
                    >
                      {block.text}
                    </p>
                  ),
                )}
                {section.slot ? slots?.[section.slot] : null}
                {section.contact ? (
                  <ul className="grid gap-3 pt-2 sm:grid-cols-2">
                    <li>
                      <a
                        href={`mailto:${contactChannels.email}`}
                        className="flex h-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-small transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        <Mail aria-hidden className="size-5 shrink-0" />
                        <span>
                          <span className="block text-muted-foreground">
                            {contactChannels.emailLabel}
                          </span>
                          <span className="font-medium">
                            {contactChannels.email}
                          </span>
                        </span>
                      </a>
                    </li>
                    {contactChannels.messengerUrl ? (
                      <li>
                        <a
                          href={contactChannels.messengerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-small transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          <MessageCircle
                            aria-hidden
                            className="size-5 shrink-0"
                          />
                          <span>
                            <span className="block text-muted-foreground">
                              {contactChannels.messengerLabel}
                            </span>
                            <span className="font-medium">
                              {contactChannels.messengerValue}
                            </span>
                          </span>
                        </a>
                      </li>
                    ) : null}
                    {contactChannels.zalo ? (
                      <li>
                        <a
                          href={contactChannels.zalo.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-small transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          <ZaloGlyph aria-hidden className="size-5 shrink-0" />
                          <span>
                            <span className="block text-muted-foreground">
                              {contactChannels.zalo.label}
                            </span>
                            <span className="font-medium tabular-nums">
                              {contactChannels.zalo.value}
                            </span>
                          </span>
                        </a>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
