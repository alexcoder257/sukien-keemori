import type { CSSProperties } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/lib/format";
import { solarToLunar } from "@/lib/lunar";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { getInvitationFamilySides } from "@/components/invitation/shared/invitation-families";
import { keepNameOnOneLine } from "@/components/invitation/shared/couple-name";
import type { WeddingDetailsData } from "@/components/invitation/shared/wedding-details/wedding-details.types";

/**
 * Preset của khối thông tin lễ cưới — song song với `opening-presets.ts`.
 *
 * Ba bố cục, đọc lại ba cách trình bày trong `docs/shares/combo-font/`:
 * bảng màu **độc lập** với bố cục, đúng như bên màn mở thiệp.
 */
export const DETAILS_VARIANTS = [
  /** font-1, font-2 — ngày kẹp giữa hai gạch ngang, số vượt ra ngoài khung kẻ. */
  "classic",
  /** font-3 — có măng sét, hai nhà ngăn bằng gạch dọc, tên kèm thứ bậc con. */
  "formal",
  /** font-4 — dải ngày ba ô kẻ khung trên dưới. */
  "modern",
] as const;
export type DetailsVariant = (typeof DETAILS_VARIANTS)[number];

export type DetailsPalette = {
  /** Chữ chính: tên cặp đôi, tên bố mẹ. */
  ink: string;
  /** Chữ phụ: câu mời, giờ, nơi tổ chức. */
  muted: string;
  /** Chìm nhất: thứ bậc con, địa chỉ, ngày âm. */
  faint: string;
  /** Số ngày và dấu `&`. */
  accent: string;
  /** Đường kẻ của dải ngày và gạch giữa hai nhà. */
  rule: string;
};

/**
 * Bỏ trống hoàn toàn là hợp lệ: mọi biến đều có fallback theo `currentColor`
 * trong CSS, nên một mẫu chưa khai màu vẫn ra đúng tông của khối bao quanh.
 * Đây là lý do không có `DETAILS_PALETTES` mặc định như bên opening — khối này
 * nằm *giữa* trang thiệp chứ không phải một màn hình riêng có nền của nó.
 */
export function detailsColorStyle(
  colors?: Partial<DetailsPalette>,
): CSSProperties {
  return Object.fromEntries(
    Object.entries(colors ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [`--details-${key}`, value]),
  ) as CSSProperties;
}

/**
 * Ngày cưới người dùng nhập là ngày dương; thứ trong tuần và ngày âm đều suy ra.
 *
 * `reception.date` lưu dạng **`22/11/2026`** (xem `lib/invitation-date.ts`),
 * nhưng dữ liệu cũ và seed có thể là ISO — nên phải nhận cả hai. Chỉ nhận ISO
 * là dải ngày và ngày âm biến mất trên đúng dữ liệu thật, mà không có lỗi nào
 * báo: khối vẫn render, chỉ thiếu mất một khối.
 */
function parseDate(value: string) {
  const raw = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(raw);
  const local = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(raw);
  const [year, month, day] = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : local
      ? [Number(local[3]), Number(local[2]), Number(local[1])]
      : [];
  if (!year || !month || !day) return null;
  if (month > 12 || day > 31) return null;
  return { year, month, day };
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Dòng đầu của `venueAddress` là tên nơi tổ chức, phần còn lại là địa chỉ.
 *
 * Bốn ảnh tham chiếu đều tách hai dòng có sức nặng khác nhau, nhưng schema chỉ
 * có một ô — và thêm ô mới vào form là bắt mọi thiệp đã nhập phải nhập lại. Gõ
 * một dòng thì vẫn ra đúng một dòng như trước.
 */
function splitVenue(value: string) {
  const [name, ...rest] = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return { name: name ?? "", address: rest.join(", ") };
}

/**
 * Ưu tiên link người dùng dán vào, rồi tới toạ độ đã bóc được, cuối cùng mới
 * tra theo chuỗi địa chỉ — cùng thứ tự hỏng mềm với module `places`.
 */
function mapHref(reception: InvitationContent["reception"]): string {
  if (/^https?:\/\//i.test(reception.mapUrl)) return reception.mapUrl;
  const query = reception.venuePlace
    ? `${reception.venuePlace.latitude},${reception.venuePlace.longitude}`
    : reception.venueAddress;
  if (!query) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Dựng `WeddingDetailsData` từ nội dung thiệp.
 *
 * Tách khỏi component vì hai lẽ: khối vẽ được cả dữ liệu không đến từ editor, và
 * phép tính ngày âm cùng cách bóc tên nơi tổ chức chỉ nằm **một chỗ** thay vì
 * lặp trong từng mẫu — mẫu cũ từng tự dựng lại đúng đoạn này.
 */
export function weddingDetailsData(
  content: InvitationContent,
  dict: Dictionary["invitation"],
  locale: Locale,
  options?: { variant?: DetailsVariant },
): WeddingDetailsData {
  const text = dict.sections.details;
  const isFormal = options?.variant === "formal";
  const reception = content.reception;
  const parts = parseDate(reception.date);
  const solar = parts
    ? new Date(parts.year, parts.month - 1, parts.day)
    : undefined;
  const lunar = parts
    ? solarToLunar(parts.day, parts.month, parts.year)
    : undefined;
  const venue = splitVenue(reception.venueAddress);
  const href = mapHref(reception);
  const time = reception.startTime || reception.welcomeTime;

  return {
    title: isFormal ? text.title : undefined,
    families: getInvitationFamilySides(
      content,
      dict.sections.families,
      false,
    ).map((side) => ({
      key: side.key,
      label: side.label,
      // Cả dòng "Ông <tên>" nối bằng NBSP: `white-space: nowrap` của
      // `DetailsParentName` thua `pre-line` của hero đầu tiên ở mẫu nào đặt khối
      // này làm section đầu (Sóng), và khi đó "Ông" bị bỏ lại một mình.
      parents: [
        side.father
          ? `${dict.sections.families.father}\u00a0${keepNameOnOneLine(side.father)}`
          : "",
        side.mother
          ? `${dict.sections.families.mother}\u00a0${keepNameOnOneLine(side.mother)}`
          : "",
      ].filter(Boolean),
      address: side.address || undefined,
    })),
    coupleNames: [content.couple.groomFullName, content.couple.brideFullName],
    childOrders: isFormal
      ? [
          // Cùng luật với `getInvitationFamilySides`: trống thì "Chú rể"/"Cô dâu".
          content.couple.groomChildOrder?.trim() || dict.sections.families.groom,
          content.couple.brideChildOrder?.trim() || dict.sections.families.bride,
        ] as [string, string]
      : undefined,
    invitation:
      content.envelope.invitation ||
      (isFormal ? text.announce : text.invitation),
    time: time ? fill(text.timeAt, { time }) : undefined,
    weekday: solar
      ? solar.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
          weekday: "long",
        })
      : undefined,
    date: parts
      ? {
          day: options?.variant === "modern" ? String(parts.day) : pad(parts.day),
          month: fill(text.monthLabel, { month: pad(parts.month) }),
          year: fill(text.yearLabel, { year: parts.year }),
        }
      : undefined,
    lunar: lunar
      ? fill(text.lunarDate, {
          day: pad(lunar.day),
          month: pad(lunar.month),
          year: lunar.canChi,
        })
      : undefined,
    venue: venue.name
      ? {
          label:
            reception.venueLabel?.trim() ||
            (isFormal ? text.ceremonyAt : text.heldAt),
          name: venue.name,
          address: venue.address || undefined,
        }
      : undefined,
    action: href ? { label: text.openMap, href } : undefined,
  };
}
