import Link from "next/link";
import { ArrowRight, MonitorSmartphone, PenTool, QrCode } from "lucide-react";
import { ScrollCue } from "@/components/home/scroll-cue";
import { hurricane } from "@/assets/fonts";
import { HeroPreloads } from "@/components/home/reveal/hero-preloads";
import { HeroStage } from "@/components/home/reveal/hero-stage";
import {
  InvitationCard,
  type InvitationCardData,
} from "@/components/home/reveal/invitation-card";
import { HERO_PORTRAIT } from "@/components/home/reveal/portrait";
import { RevealLoader } from "@/components/home/reveal/reveal-loader";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import styles from "./hero.module.css";

type Props = {
  dict: Dictionary["home"]["hero"];
  scrollHint: Dictionary["common"]["scrollHint"];
  locale: Locale;
};

export function Hero({ dict, scrollHint, locale }: Props) {
  const card: InvitationCardData = dict.card;

  return (
    <div className={`theme-reveal ${hurricane.variable} ${styles.hero}`}>
      {/* Client Component, không viết `<link>` thẳng ở đây — xem lý do trong
          `hero-preloads.tsx`. */}
      <HeroPreloads />
      <HeroStage>
        <RevealLoader card={card} />
        <section className={styles.scene} aria-label={dict.keyword}>
          <div className={styles.copy}>
            <h1 data-reveal-item className={styles.headline}>
              {/* Khoảng trắng sau nhãn: các span là `display: block` nên mắt
                  không thấy, nhưng vẫn cần cho crawler và trình đọc màn hình. */}
              <span className={styles.keyword}>{dict.keyword}</span>{" "}
              {dict.title.split("\n").map((line, index) => (
                <span key={index} className={styles.line}>
                  {line}{" "}
                </span>
              ))}
              <em className={styles.accent}>{dict.titleAccent}</em>
            </h1>
            <p data-reveal-item className={styles.lead}>
              {dict.lead}
            </p>
            <div data-reveal-item className={styles.actions}>
              {/* Bước chọn loại thiệp, không phải kho mẫu: mỗi loại có form
                  riêng, và kho mẫu hiện chưa có mẫu nào. */}
              <Link href={`/${locale}/tao-thiep`} className={styles.primaryCta}>
                {dict.primaryCta}
                <ArrowRight size={18} aria-hidden />
              </Link>
              {/* Thiệp được thiết kế riêng theo yêu cầu, nên lối thứ hai là trò
                  chuyện với người thiết kế — cùng đích với nút của thẻ thiệp
                  custom ở `/bang-gia`. */}
              <Link href={`/${locale}/lien-he`} className={styles.secondaryCta}>
                {dict.secondaryCta}
              </Link>
            </div>
            <p data-reveal-item className={styles.trust}>
              {dict.trust}
            </p>
          </div>

          {/* Responsive crops of the generated event and birthday photograph. */}
          <div className={styles.visual}>
            <div className={styles.portrait}>
              <picture>
                <source
                  media={HERO_PORTRAIT.desktopMedia}
                  srcSet={HERO_PORTRAIT.desktopSrcSet}
                  sizes={HERO_PORTRAIT.desktopSizes}
                />
                <img
                  src={HERO_PORTRAIT.mobileSrc}
                  width={1044}
                  height={941}
                  alt=""
                  fetchPriority="high"
                  decoding="async"
                  className={styles.photo}
                />
              </picture>
            </div>
            <p aria-hidden className={styles.saveDate}>
              {dict.celebrationNote.split("\n").map((line) => (
                <span key={line}>{line}</span>
              ))}
              <svg viewBox="0 0 170 140" fill="none">
                <path
                  d="M165 5C83 21 28 61 5 135"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </p>
          </div>
          <div aria-hidden className={styles.scrim} />

          <HeroHighlights highlights={dict.highlights} />
          <div className={styles.stationery}>
            <div data-reveal-card-scroll className={styles.cardSlot}>
              <div data-reveal-card-wrap className={styles.cardWrap}>
                <InvitationCard data={card} />
              </div>
            </div>
            <div className={styles.signature}>
              <p>{dict.signature}</p>
              <span>{dict.signatureBrand}</span>
            </div>
          </div>
          <div data-reveal-item className={styles.scrollCue}>
            <ScrollCue label={scrollHint} className="text-white" />
          </div>
        </section>
      </HeroStage>
    </div>
  );
}

/** Biểu tượng theo khoá, không theo vị trí — đổi thứ tự trong từ điển không làm lệch hình. */
const HIGHLIGHT_ICONS = {
  design: PenTool,
  share: QrCode,
  devices: MonitorSmartphone,
} as const;

/**
 * Ba điểm mạnh của sản phẩm, chữ cố định. Từng là số thiệp đã tạo và số mẫu
 * lấy từ backend — một sản phẩm mới mở hay một kho mẫu đang làm mới là hiện
 * "0+" ngay dưới lời chào đầu tiên.
 */
function HeroHighlights({
  highlights,
}: {
  highlights: Dictionary["home"]["hero"]["highlights"];
}) {
  return (
    <ul className={styles.highlights}>
      {(Object.keys(HIGHLIGHT_ICONS) as (keyof typeof HIGHLIGHT_ICONS)[]).map(
        (key) => {
          const Icon = HIGHLIGHT_ICONS[key];
          return (
            <li key={key}>
              <Icon aria-hidden size={16} strokeWidth={1.5} />
              {highlights[key]}
            </li>
          );
        },
      )}
    </ul>
  );
}
