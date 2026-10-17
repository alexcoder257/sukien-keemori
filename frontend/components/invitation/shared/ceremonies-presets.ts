import type { CSSProperties } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { parseDateTimeValue } from "@/lib/invitation-date";
import type { Ceremony } from "@/lib/schemas/invitation";
import type { WeddingCeremoniesData } from "@/components/invitation/shared/wedding-ceremonies/wedding-ceremonies.types";

/**
 * Preset của khối nghi lễ — song song với `details-presets.ts`.
 *
 * Ba bố cục rút từ kho mẫu cũ, không phải nghĩ ra: `stack` (khối canh giữa
 * xếp dọc), `timeline` (trục mốc thời gian) và `card` (cách `classic` đang bày).
 */
export const CEREMONIES_VARIANTS = [
  /** Từng nghi lễ là một khối canh giữa, xếp dọc. Không khung, không gạch. */
  "stack",
  /** Mốc thời gian: giờ đọc trước tên, có trục và dấu mốc chạy dọc. */
  "timeline",
  /** Mỗi nghi lễ một thẻ có nền và viền; rộng chỗ thì xếp hai cột. */
  "card",
] as const;
export type CeremoniesVariant = (typeof CEREMONIES_VARIANTS)[number];

/**
 * Bốn vai, cố ý **không có bậc "faint"**.
 *
 * Bản trước có, và hệ quả là lời thông báo — chữ người dùng tự viết — bị gán vào
 * đó rồi rơi xuống 2.96:1 trên nền giấy, dưới ngưỡng AA khá xa. Một biến màu
 * nhạt để sẵn thì sớm muộn có chữ rơi vào; bỏ hẳn thì không còn chỗ để rơi.
 * Sắc độ chìm hơn nữa, nếu mẫu cần, thuộc về `rule` — thứ chỉ vẽ đường kẻ.
 */
export type CeremoniesPalette = {
  /** Tên nghi lễ và con số giờ — hạng đậm nhất. */
  ink: string;
  /** Ngày, địa điểm, lời thông báo. Phải đạt AA trên nền của mẫu. */
  muted: string;
  /** Măng sét và hạt trám ngăn cách. */
  accent: string;
  /** Trục dọc, mép bảng khắc, nét kẻ hoạ tiết. */
  rule: string;
  /** Nền bảng khắc — chỉ `card` dùng; mặc định trong suốt. */
  surface: string;
};

/**
 * Bỏ trống hoàn toàn là hợp lệ: mọi biến có fallback theo `currentColor`, nên
 * một mẫu chưa khai màu vẫn ra đúng tông của chương bao quanh.
 */
export function ceremoniesColorStyle(
  colors?: Partial<CeremoniesPalette>,
): CSSProperties {
  return Object.fromEntries(
    Object.entries(colors ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [`--ceremony-${key}`, value]),
  ) as CSSProperties;
}

/**
 * `10:00 · 22/11/2026` → giờ và ngày rời nhau, ngày viết đủ chữ.
 *
 * `formatDateTime` của `lib/format` **không dùng được ở đây**: nó nhận chuỗi
 * ISO, còn `ceremonies[].dateTime` lưu dạng `10:00 · 22/11/2026` (xem
 * `lib/invitation-date.ts`) nên `new Date()` trả về `Invalid Date` và hàm trả
 * nguyên chuỗi vào. Nghĩa là trước đây thiệp hiện đúng chuỗi thô đã lưu, không
 * qua bản địa hoá nào.
 *
 * Ngày viết đủ chữ kèm thứ trong tuần vì khách mời cần biết rơi vào ngày nào
 * trong tuần để thu xếp — `14/11/2026` bắt người đọc tự tra.
 */
function splitDateTime(value: string, locale: Locale) {
  const { date, time } = parseDateTimeValue(value);
  return {
    time: time || undefined,
    date: date
      ? date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : undefined,
  };
}

/**
 * Dựng `WeddingCeremoniesData` từ danh sách nghi lễ.
 *
 * Nhận **danh sách đã lọc** của `invitationBlocks`, không phải `content` thô:
 * luật "nghi lễ rỗng thì không tính" đã nằm ở đó và còn quyết định cả
 * `show.ceremonies`. Lọc lại lần nữa ở đây là chép luật ra hai chỗ, và hai chỗ
 * thì sớm muộn lệch nhau.
 *
 * (Schema bắt buộc mảng có ít nhất một phần tử, nên thiệp mới tạo luôn mang sẵn
 * một nghi lễ chưa nhập gì — đó là lý do phép lọc tồn tại.)
 */
export function weddingCeremoniesData(
  ceremonies: Ceremony[],
  dict: Dictionary["invitation"]["sections"]["ceremonies"],
  kindDict: Dictionary["editor"]["ceremonyKinds"],
  locale: Locale,
): WeddingCeremoniesData {
  return {
    title: dict.title,
    items: ceremonies.map((ceremony, index) => ({
      id: `${ceremony.kind}-${index}`,
      name:
        ceremony.kind === "other" && ceremony.customKind
          ? ceremony.customKind
          : kindDict[ceremony.kind],
      /* Ô trống thành `undefined` chứ không phải chuỗi rỗng: phần trình bày ẩn
         theo `undefined`, còn `""` vẫn là một giá trị và sẽ vẽ ra một dòng rỗng. */
      ...splitDateTime(ceremony.dateTime, locale),
      venue: ceremony.venue || undefined,
      note: ceremony.note || undefined,
    })),
  };
}
