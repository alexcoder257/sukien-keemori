import Image from "next/image";
import type { ReactNode } from "react";
import { InvitationAlbum } from "@/components/invitation/shared/invitation-album";
import {
  giftBoxForKind,
  invitationBlocks,
} from "@/components/invitation/shared/invitation-blocks";
import { InvitationCountdown } from "@/components/invitation/shared/invitation-countdown";
import { InvitationGiftBox } from "@/components/invitation/shared/invitation-gift-box";
import { InvitationMusicToggle } from "@/components/invitation/shared/invitation-music-toggle";
import { InvitationOpening } from "@/components/invitation/shared/invitation-opening";
import {
  GateFoldOpening,
  type GateFoldArt,
} from "@/components/invitation/shared/gate-fold-opening/gate-fold-opening";
import {
  GATE_FOLD_OPENING,
  GATE_FOLD_OPENING_STYLE,
} from "@/components/invitation/shared/gate-fold-opening/gate-fold-timing";
import { InvitationRsvp } from "@/components/invitation/shared/invitation-rsvp";
import type { InvitationTemplateProps } from "@/components/invitation/shared/invitation-template";
import { InvitationWishes } from "@/components/invitation/shared/invitation-wishes";
import { fill } from "@/lib/format";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { BurgundyGuestName } from "./burgundy-guest-name";
import styles from "./burgundy-birthday.module.css";

const PLACEHOLDER_PHOTO = "/images/site/placeholder.avif";
const SCENE_PHOTO =
  "/images/templates/burgundy-birthday/decor/candlelit-table.avif";
/**
 * Màn mở đầu y hệt mẫu Đỏ Burgundy của keemori.com: cùng bộ ba ảnh giấy gấp
 * cổng thắt nơ lụa (chép nguyên từ `do-burgundy/decor`). Đường viền nơ trong
 * `gate-fold-ribbon.tsx` dò trên đúng hình học bộ ảnh này, nên không thay bằng
 * tấm giấy khác được — chỉ được tô lại màu.
 */
const OPENING_ART: GateFoldArt = {
  wrap: "/images/templates/burgundy-birthday/decor/opening-wrap.avif",
  paper: "/images/templates/burgundy-birthday/decor/opening-paper.avif",
  innerPaper:
    "/images/templates/burgundy-birthday/decor/opening-inner-paper.avif",
};

/** Bốn hạt kim cương ở bốn góc khung viền vàng. */
function Corners() {
  return (
    <>
      <span
        className={`${styles.corner} ${styles.cornerTl}`}
        aria-hidden="true"
      />
      <span
        className={`${styles.corner} ${styles.cornerTr}`}
        aria-hidden="true"
      />
      <span
        className={`${styles.corner} ${styles.cornerBl}`}
        aria-hidden="true"
      />
      <span
        className={`${styles.corner} ${styles.cornerBr}`}
        aria-hidden="true"
      />
    </>
  );
}

function CandleOrnament({ className }: { className: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 220 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.55"
    >
      <path d="M8 22 H94 M126 22 H212" />
      <circle cx="98.5" cy="22" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="121.5" cy="22" r="1.3" fill="currentColor" stroke="none" />
      <path d="M110 3 C114 9 117 13 117 17.5 A7 7 0 0 1 103 17.5 C103 13 106 9 110 3 Z" />
      <path
        d="M110 10.5 C112.2 13.8 113.6 15.8 113.6 18.2 A3.6 3.6 0 0 1 106.4 18.2 C106.4 15.8 107.8 13.8 110 10.5 Z"
        fill="var(--gold-bright)"
        stroke="none"
      />
      <path d="M110 24.5 V27" />
    </svg>
  );
}

function Star({ className }: { className: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 14 14"
      fill="currentColor"
    >
      <path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" />
    </svg>
  );
}

/** Đường kẻ mảnh, giữa là ngôi sao bốn cánh. */
function StarRule({ className }: { className: string }) {
  return (
    <div className={className} aria-hidden="true">
      <span />
      <Star className={styles.ruleStar} />
      <span />
    </div>
  );
}

const WREATH_LEAVES =
  "M41.2 82.8Q39.6 75.4 32.3 73.4Q33.9 80.8 41.2 82.8Z M41.2 82.8Q33.9 80.9 28.7 86.5Q36.1 88.4 41.2 82.8Z M30.5 77.9Q31.4 70.7 25.6 66.5Q24.6 73.7 30.5 77.9Z M30.5 77.9Q24.6 73.8 18.2 77.1Q24.1 81.2 30.5 77.9Z M22.1 69.5Q25.3 63.4 21.4 57.8Q18.3 63.9 22.1 69.5Z M22.1 69.5Q18.2 64 11.4 64.8Q15.4 70.4 22.1 69.5Z M17.2 58.8Q21.9 54.4 20.3 48.2Q15.6 52.6 17.2 58.8Z M17.2 58.8Q15.4 52.6 9.1 51.2Q10.9 57.4 17.2 58.8Z M16.1 47Q21.7 44.7 22.3 38.7Q16.7 41 16.1 47Z M16.1 47Q16.6 41 11.5 37.7Q11 43.8 16.1 47Z M19.2 35.6Q24.9 35.4 27.3 30.3Q21.6 30.5 19.2 35.6Z M19.2 35.6Q21.5 30.5 18.1 25.9Q15.7 31.1 19.2 35.6Z M26 26Q31 27.6 34.8 23.8Q29.7 22.2 26 26Z M26 26Q29.7 22.2 28.1 17.1Q24.4 20.9 26 26Z M35.6 19.2Q39.6 19.5 42 16.2Q38 15.9 35.6 19.2Z M58.8 82.8Q63.9 88.4 71.3 86.5Q66.1 80.9 58.8 82.8Z M58.8 82.8Q66.1 80.8 67.7 73.4Q60.4 75.4 58.8 82.8Z M69.5 77.9Q75.9 81.2 81.8 77.1Q75.4 73.8 69.5 77.9Z M69.5 77.9Q75.4 73.7 74.4 66.5Q68.6 70.7 69.5 77.9Z M77.9 69.5Q84.6 70.4 88.6 64.8Q81.8 64 77.9 69.5Z M77.9 69.5Q81.7 63.9 78.6 57.8Q74.7 63.4 77.9 69.5Z M82.8 58.8Q89.1 57.4 90.9 51.2Q84.6 52.6 82.8 58.8Z M82.8 58.8Q84.4 52.6 79.7 48.2Q78.1 54.4 82.8 58.8Z M83.9 47Q89 43.8 88.5 37.7Q83.4 41 83.9 47Z M83.9 47Q83.3 41 77.7 38.7Q78.3 44.7 83.9 47Z M80.8 35.6Q84.3 31.1 81.9 25.9Q78.5 30.5 80.8 35.6Z M80.8 35.6Q78.4 30.5 72.7 30.3Q75.1 35.4 80.8 35.6Z M74 26Q75.6 20.9 71.9 17.1Q70.3 22.2 74 26Z M74 26Q70.3 22.2 65.2 23.8Q69 27.6 74 26Z M64.4 19.2Q62 15.9 58 16.2Q60.4 19.5 64.4 19.2Z";

/** Chữ đầu tên trong vòng nguyệt quế. */
function Monogram({ letters }: { letters: string }) {
  return (
    <div className={styles.monogramRow} aria-hidden="true">
      <span className={styles.monogramLine} />
      <div className={styles.wreath}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeLinejoin="round"
        >
          <path d="M41.2 82.8A34 34 0 0 1 35.6 19.2M58.8 82.8A34 34 0 0 0 64.4 19.2" />
          <path d={WREATH_LEAVES} fill="currentColor" fillOpacity="0.1" />
          <path
            d="M50 81 L54 85 L50 89 L46 85 Z"
            fill="var(--gold-bright)"
            stroke="none"
          />
          <path
            d="M50 9 L52 11 L50 13 L48 11 Z"
            fill="var(--gold-bright)"
            stroke="none"
          />
        </svg>
        <span>{letters}</span>
      </div>
      <span className={styles.monogramLine} />
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      className={styles.factIcon}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5" width="17" height="15" rx="1" />
      <path d="M3.5 9.5 H20.5 M8 3 V6.5 M16 3 V6.5" />
      <path d="M12 12 L13 14.2 L15.3 14.5 L13.6 16 L14 18.3 L12 17.2 L10 18.3 L10.4 16 L8.7 14.5 L11 14.2 Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      className={styles.factIcon}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21 C12 21 5 14.5 5 9.5 A7 7 0 0 1 19 9.5 C19 14.5 12 21 12 21 Z" />
      <path d="M12 6.8 L14.7 9.5 L12 12.2 L9.3 9.5 Z" />
    </svg>
  );
}

function GlassesIcon() {
  return (
    <svg
      className={styles.factIcon}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3 H11 L10.5 8 A2.5 2.5 0 0 1 7.5 8 Z M9 8.6 V15 M7 15 H11" />
      <path d="M13 3 H17 L16.5 8 A2.5 2.5 0 0 1 13.5 8 Z M15 8.6 V15 M13 15 H17" />
      <path d="M4 19 H20" />
      <path d="M12 19.5 V21" />
    </svg>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.fact}>
      <div className={styles.factBody}>
        {/* Biểu tượng đứng ngay trước nhãn, cùng một dòng — không thành một
            cột riêng bên trái đẩy cả khối chữ lệch vào trong. */}
        <p className={`${styles.label} ${styles.factLabel}`}>
          {icon}
          <span>{label}</span>
        </p>
        {children}
      </div>
    </div>
  );
}

function FactDivider() {
  return (
    <div className={styles.factDivider} aria-hidden="true">
      <Star className={styles.factDividerStar} />
    </div>
  );
}

/** Một chương phía dưới tấm thiệp: khung viền vàng đôi trên nền nhung. */
function Panel({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <span className={styles.panelInset} aria-hidden="true" />
      <Corners />
      <h2 className={styles.panelTitle}>{title}</h2>
      <StarRule className={styles.panelRule} />
      {lead ? <p className={styles.panelLead}>{lead}</p> : null}
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

/**
 * Thời điểm buổi tiệc. Ưu tiên ngày + giờ của khối "Thời gian & địa điểm" vì đó
 * là thứ khách cần biết; thiếu thì lấy mốc đếm ngược. Ngày tiệc là chuỗi
 * `dd/mm/yyyy` người dùng gõ, nên ghép lại thành ISO giờ Việt Nam — để `Date`
 * tự đoán thì server và trình duyệt ở hai múi giờ ra hai ngày khác nhau.
 */
function eventDate(content: InvitationContent): Date | null {
  const day = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
    content.reception.date.trim(),
  );
  const time = /^(\d{1,2}):(\d{2})$/.exec(content.reception.startTime.trim());
  const pad = (value: string) => value.padStart(2, "0");
  const iso = day
    ? `${day[3]}-${pad(day[2])}-${pad(day[1])}T${time ? `${pad(time[1])}:${time[2]}` : "00:00"}:00+07:00`
    : content.countdown.weddingDate;
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Địa chỉ là một ô chữ tự do. Thiệp chỉ in tên nơi tổ chức (trước dấu phẩy
 * đầu) và tỉnh/thành (hai phần cuối); số nhà, tên đường nằm trong link chỉ
 * đường bọc quanh tên nơi tổ chức.
 */
function splitVenue(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return { name: parts[0] ?? "", place: parts.slice(1).slice(-2).join(", ") };
}

/** Chữ đầu của hai từ cuối tên ("Khải Hồ" → "KH"). */
function monogramOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0]?.toLocaleUpperCase("vi") ?? "")
    .join("");
}

type DressGroup = { label: string; caption: string; colors: string[] };

/**
 * Dress code chia theo nhóm khách bằng chính ô mô tả: mỗi dòng `Nhãn: màu ·
 * màu` là một cột. Mỗi **tên màu khác nhau** ứng với một ô trong
 * `dressCode.colors`, theo thứ tự tên đó xuất hiện lần đầu — "Nữ: Đỏ rượu" +
 * "Nam: Đen · Đỏ rượu" với hai ô (đỏ rượu, đen) ra đúng hai cột của thiết kế,
 * đỏ rượu dùng lại ở cột Nam. Không bắt nhập trùng màu: bộ chọn màu của editor
 * coi danh sách là tập không trùng. Mô tả không theo khuôn đó thì là một cột
 * duy nhất mang cả câu mô tả và mọi ô màu.
 */
function dressGroups(description: string, colors: string[]): DressGroup[] {
  const lines = description
    .split("\n")
    .map((line) => /^(.{1,24}?):\s*(.+)$/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null);
  if (lines.length === 0) return [{ label: "", caption: description, colors }];

  const colorOf = new Map<string, string>();
  const groups = lines.map(([, label, caption]) => {
    const names = caption.split("·").map((name) => name.trim()).filter(Boolean);
    for (const name of names) {
      const key = name.toLocaleLowerCase("vi");
      if (!colorOf.has(key) && colorOf.size < colors.length) {
        colorOf.set(key, colors[colorOf.size]);
      }
    }
    return { label, names, caption: names.join("  ·  ") };
  });
  return groups.map(({ label, names, caption }) => ({
    label,
    caption,
    colors: names
      .map((name) => colorOf.get(name.toLocaleLowerCase("vi")))
      .filter((color): color is string => Boolean(color)),
  }));
}

/**
 * Burgundy — thiệp sinh nhật một màn: nền nhung đỏ rượu, khung viền vàng đôi,
 * chân dung, huy hiệu chữ đầu trong vòng nguyệt quế, ba cột thời gian · địa
 * điểm · lời đón, rồi ảnh bàn tiệc và dress code. Dựng theo canvas thiết kế
 * "Thiệp sinh nhật Khải Hồ" (Desktop 1200px, Mobile 390px); dưới 900px bề rộng
 * thiệp, bố cục chuyển sang bản Mobile.
 *
 * Mẫu chỉ dành cho thiệp **sinh nhật** (`templates.kind`), nên nó đọc thẳng
 * `content.occasion`.
 *
 * Mở đầu bằng màn giấy gấp cổng của Đỏ Burgundy (`shared/gate-fold-opening`):
 * nơ tuột, bốn cánh giấy lật, máy quay tiến vào đúng tấm thiệp nằm dưới. Ở link
 * mời riêng, tên khách hiện ở **cả hai** chỗ — trên màn giấy và ngay dưới
 * "Trân trọng kính mời" của thiệp. Đây là ngoại lệ có chủ ý của mẫu này so với
 * luật "chỉ một câu mời" trong `CLAUDE.md`: chủ thiệp muốn tên khách nằm trên
 * chính tấm thiệp, không chỉ trên màn mở đầu đã biến mất sau một lần chạm.
 */
export function BurgundyBirthday({
  content,
  dict,
  locale,
  photoSlots,
  showMusicToggle = true,
  musicTogglePlacement = "viewport",
}: InvitationTemplateProps) {
  const copy = dict.burgundyBirthday;
  const sections = dict.sections;
  const { show, timelineItems, dressCodeColors, approvedWishes } =
    invitationBlocks(content);
  const occasion = content.occasion;
  const name = occasion?.nickname || occasion?.name || "";
  const reception = content.reception;
  const venue = splitVenue(reception.venueAddress);
  const photo = photoSlots.includes("cover") ? content.photos.cover : undefined;
  const mapHref =
    reception.mapUrl ||
    (reception.venueAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reception.venueAddress)}`
      : "");

  const date = eventDate(content);
  const format = (options: Intl.DateTimeFormatOptions) =>
    date
      ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
          ...options,
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(date)
      : "";
  const weekday = format({ weekday: "long" }).replace(/^\p{Ll}/u, (letter) =>
    letter.toLocaleUpperCase(locale),
  );
  const time =
    reception.startTime ||
    format({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const [headingFirst, ...headingRest] = copy.warmInvitation.split(", ");
  const groups = dressGroups(content.dressCode.description, dressCodeColors);

  return (
    <div
      className={styles.root}
      data-gate-opening-root
      style={GATE_FOLD_OPENING_STYLE}
    >
      <InvitationOpening
        enabled={show.envelope}
        durationMs={GATE_FOLD_OPENING.duration}
        motion="fade"
        coverClassName={styles.opening}
        contentClassName={styles.openingContent}
        renderCover={({ openInvitation, isOpening }) => (
          <GateFoldOpening
            art={OPENING_ART}
            openInvitation={openInvitation}
            isOpening={isOpening}
            label={copy.openWrapper}
            greeting={content.envelope.greeting || copy.invitationLabel}
          />
        )}
        renderOutside={({ opened }) =>
          opened && show.music && showMusicToggle ? (
            <InvitationMusicToggle
              dict={dict}
              trackId={content.music.trackId}
              placement={musicTogglePlacement}
            />
          ) : null
        }
      >
        <article
          className={styles.card}
          data-gate-opening-cover
          data-opening-focus
          tabIndex={-1}
        >
          <div className={styles.frame}>
            <span className={styles.frameInset} aria-hidden="true" />
            <Corners />
            <div className={styles.inner}>
              <div className={styles.top}>
                <div className={styles.intro}>
                  <p className={`${styles.label} ${styles.greeting}`}>
                    {content.envelope.greeting || copy.invitationLabel}
                  </p>
                  {/* Tên khách luôn hiện ở link mời riêng, kể cả khi màn giấy
                      gấp cổng đã ghi tên đó: khách cuộn lại đầu thiệp vẫn
                      thấy lời mời gửi đích danh mình. */}
                  <BurgundyGuestName className={styles.guest} />
                  <CandleOrnament className={styles.candle} />
                  <p className={styles.script}>{copy.birthday}</p>
                  <h1 className={styles.name}>{name}</h1>
                  <div className={styles.nameRule} aria-hidden="true">
                    <span />
                    <i />
                    <span />
                  </div>
                </div>

                <figure className={styles.portrait}>
                  <div className={styles.portraitInner}>
                    <Image
                      src={photo || PLACEHOLDER_PHOTO}
                      alt={photo ? name : ""}
                      fill
                      // Ảnh khách tải lên (`/uploads`, `blob:` lúc chờ upload)
                      // đã được nén ở backend — đi thẳng, như `AlbumPhoto`.
                      unoptimized={!!photo && !photo.startsWith("/images/")}
                      sizes="(max-width: 440px) 70vw, 312px"
                      loading="eager"
                      quality={90}
                      className={styles.portraitPhoto}
                    />
                  </div>
                  <Corners />
                </figure>

                <div className={styles.aside}>
                  <Monogram letters={monogramOf(name)} />
                  <h2 className={styles.heading}>
                    {headingFirst}
                    {headingRest.length > 0 ? (
                      <>
                        ,<br className={styles.headingBreak} />{" "}
                        {headingRest.join(", ")}
                      </>
                    ) : null}
                  </h2>
                  <p className={styles.lead}>
                    {content.envelope.invitation ||
                      fill(copy.invitationMessage, { name })}
                  </p>
                </div>
              </div>

              <StarRule className={styles.rule} />

              <div className={styles.facts}>
                <Fact icon={<CalendarIcon />} label={copy.timeLabel}>
                  {date ? (
                    <p className={styles.date}>
                      {format({ day: "2-digit" })}
                      <span>/</span>
                      {format({ month: "2-digit" })}
                      <span>/</span>
                      {format({ year: "numeric" })}
                    </p>
                  ) : null}
                  {/* Giờ đi với thứ trong tuần, không với tên nơi tổ chức: địa
                    điểm đã có ô riêng ngay cạnh, lặp lại ở đây là nói hai lần. */}
                  {time || weekday ? (
                    <p className={styles.factLine}>
                      {time ? (
                        <span className={styles.time}>{time}</span>
                      ) : null}
                      {time && weekday ? "  ·  " : null}
                      {weekday}
                    </p>
                  ) : null}
                </Fact>
                <FactDivider />
                <Fact icon={<PinIcon />} label={copy.locationLabel}>
                  {mapHref ? (
                    <a
                      className={styles.venue}
                      href={mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${venue.name} — ${copy.viewMap}`}
                    >
                      {venue.name}
                    </a>
                  ) : (
                    <p className={styles.venue}>{venue.name}</p>
                  )}
                  {venue.place ? (
                    <p className={styles.place}>{venue.place}</p>
                  ) : null}
                </Fact>
                <FactDivider />
                <Fact icon={<GlassesIcon />} label={copy.partyLabel}>
                  <p className={styles.factText}>
                    {(show.thankYou && content.thankYou.message) ||
                      copy.partyMessage}
                  </p>
                </Fact>
              </div>
            </div>
          </div>

          <div className={styles.bottom}>
            <div className={styles.scene}>
              <Image
                src={SCENE_PHOTO}
                alt=""
                fill
                sizes="(max-width: 440px) 100vw, 660px"
                className={styles.scenePhoto}
              />
            </div>
            {show.dressCode ? (
              <section
                className={styles.dress}
                aria-labelledby="dress-code-heading"
              >
                <span className={styles.panelInset} aria-hidden="true" />
                <Corners />
                <h2 id="dress-code-heading" className={styles.dressTitle}>
                  {content.dressCode.title || copy.dressCode}
                </h2>
                <StarRule className={styles.dressRule} />
                <div className={styles.dressGroups}>
                  {groups.map((group, index) => (
                    <div key={index} className={styles.dressGroup}>
                      {group.label ? (
                        <p className={styles.label}>{group.label}</p>
                      ) : null}
                      {group.colors.length > 0 ? (
                        <ul className={styles.swatches}>
                          {group.colors.map((color, colorIndex) => (
                            <li key={colorIndex} style={{ background: color }}>
                              <span className={styles.srOnly}>
                                {fill(sections.dressCode.colorLabel, { color })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {group.caption ? (
                        <p className={styles.dressCaption}>{group.caption}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </article>

        {show.countdown ? (
          <Panel title={sections.countdown.title}>
            <InvitationCountdown
              content={content}
              dict={sections.countdown}
              locale={locale}
            />
          </Panel>
        ) : null}

        {show.timeline ? (
          <Panel title={content.timeline.title || sections.timeline.title}>
            <ol className={styles.timeline}>
              {timelineItems.map((item, index) => (
                <li key={index}>
                  <span>
                    {[item.startTime, item.endTime].filter(Boolean).join(" – ")}
                  </span>
                  <p>{item.activity}</p>
                </li>
              ))}
            </ol>
          </Panel>
        ) : null}

        {show.story ? (
          <Panel title={sections.story.title}>
            <p className={styles.story}>{content.story.message}</p>
          </Panel>
        ) : null}

        {show.album ? (
          <Panel title={sections.album.title}>
            <InvitationAlbum
              photos={content.album.photos}
              dict={sections.album}
            />
          </Panel>
        ) : null}

        {show.giftBox ? (
          <Panel
            title={sections.giftBox.title}
            lead={sections.giftBox.subtitle}
          >
            <InvitationGiftBox
              giftBox={giftBoxForKind(content)}
              dict={sections.giftBox}
            />
          </Panel>
        ) : null}

        {show.wishes ? (
          <Panel title={sections.wishes.title} lead={sections.wishes.subtitle}>
            <InvitationWishes
              wishes={approvedWishes}
              dict={sections.wishes}
              errors={dict.errors}
              locale={locale}
            />
          </Panel>
        ) : null}

        {show.rsvp ? (
          <Panel title={sections.rsvp.title} lead={sections.rsvp.subtitle}>
            <InvitationRsvp dict={sections.rsvp} errors={dict.errors} />
          </Panel>
        ) : null}
      </InvitationOpening>
    </div>
  );
}
