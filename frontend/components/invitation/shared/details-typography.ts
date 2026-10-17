import type { CSSProperties } from "react";
import {
  arcittyaBegatri,
  beVietnamPro,
  cormorant,
  cormorantSc,
  ebGaramond,
  greatVibes,
  lora,
  playfairDisplay,
  uvnHoaTay,
} from "@/assets/fonts";

/**
 * Typography của khối "thông tin lễ cưới" (`wedding-details.tsx`).
 *
 * Cùng hợp đồng với `opening-typography.ts` và cố ý **không dùng chung** với
 * nó: màn bìa và khối thông tin có tập vùng chữ khác hẳn nhau, gộp lại thì mỗi
 * bên phải mang theo vùng của bên kia. Cái dùng chung thật sự là *cách làm* —
 * combo đặt nền, vùng chữ đè lên — chứ không phải danh sách vùng.
 *
 * Font khai ở đây đều `preload: false`; combo đổi được lúc chạy nên mọi ứng
 * viên phải có `@font-face` sẵn, và đó là lý do registry này tồn tại.
 */

/**
 * `lining` — bộ chữ số cao đều nhau, đứng trên đường chân chữ. Xem chú thích
 * cùng tên ở `ceremonies-typography.ts`: serif display cổ điển mặc định dùng
 * chữ số oldstyle, và số ngày cỡ lớn viết bằng bộ đó thì "25" cao thấp so le.
 * Đo bằng fontTools trên chính file font.
 */
export const DETAILS_FONTS = {
  "great-vibes": {
    label: "Great Vibes",
    family: "var(--font-great-vibes), cursive",
    lining: false,
    variable: greatVibes.variable,
  },
  "uvn-hoa-tay": {
    label: "UVN Hoa Tay",
    family: "var(--font-uvn-hoa-tay), cursive",
    lining: true,
    variable: uvnHoaTay.variable,
  },
  "arcittya-begatri": {
    label: "Arcittya Begatri",
    family: "var(--font-arcittya-begatri), cursive",
    lining: true,
    variable: arcittyaBegatri.variable,
  },
  "playfair-display": {
    label: "Playfair Display",
    family: "var(--font-playfair), Georgia, serif",
    lining: false,
    variable: playfairDisplay.variable,
  },
  cormorant: {
    label: "Cormorant",
    family: "var(--font-cormorant), Georgia, serif",
    lining: false,
    variable: cormorant.variable,
  },
  "cormorant-sc": {
    label: "Cormorant SC",
    family: "var(--font-cormorant-sc), Georgia, serif",
    lining: false,
    variable: cormorantSc.variable,
  },
  "eb-garamond": {
    label: "EB Garamond",
    family: "var(--font-eb-garamond), Georgia, serif",
    lining: true,
    variable: ebGaramond.variable,
  },
  lora: {
    label: "Lora",
    family: "var(--font-lora), Georgia, serif",
    lining: false,
    variable: lora.variable,
  },
  "be-vietnam-pro": {
    label: "Be Vietnam Pro",
    family: "var(--font-be-vietnam-pro), sans-serif",
    lining: true,
    variable: beVietnamPro.variable,
  },
} as const;

export type DetailsFontId = keyof typeof DETAILS_FONTS;

/**
 * Vùng chữ của khối. Chia theo **vai trong nội dung**, không theo thẻ HTML: hai
 * chỗ cùng là `<p>` nhưng một chỗ là tên bố mẹ còn một chỗ là câu kính mời thì
 * mẫu phải chỉnh được riêng từng chỗ.
 */
export const DETAILS_TEXT_REGIONS = [
  "title",
  "sideLabel",
  "parentName",
  "invitation",
  "names",
  "role",
  "ampersand",
  "time",
  "dateNumber",
  "dateUnit",
  "lunar",
  "venueLabel",
  "venue",
  "address",
  "action",
] as const;
export type DetailsTextRegion = (typeof DETAILS_TEXT_REGIONS)[number];
/** Id đã đăng ký hiện ra trong gợi ý; chuỗi `font-family` CSS vẫn nhận được. */
export type DetailsFontValue = DetailsFontId | (string & {});
export type DetailsRegionFonts = Partial<
  Record<DetailsTextRegion, DetailsFontValue>
>;

/**
 * Một combo chỉ khai **bốn vai** — tên, accent, display, body — rồi trải ra 15
 * vùng. Khai thẳng 15 vùng cho mỗi combo thì thêm một vùng mới phải sửa mọi
 * combo, và bốn vai này đã là toàn bộ những gì bốn ảnh tham chiếu dùng.
 */
/** Vùng chữ chỉ chứa chữ số; font gán vào đây bắt buộc phải có `lining`. */
const NUMERIC_REGIONS: readonly DetailsTextRegion[] = ["dateNumber"];

/** Rơi về đây khi vùng số bị gán một font oldstyle. */
const NUMERAL_FALLBACK: DetailsFontId = "eb-garamond";

function isLining(font: string): boolean {
  return Object.prototype.hasOwnProperty.call(DETAILS_FONTS, font)
    ? DETAILS_FONTS[font as DetailsFontId].lining
    : true;
}

function combo(
  names: DetailsFontId,
  accent: DetailsFontId,
  display: DetailsFontId,
  body: DetailsFontId,
  numeral: DetailsFontId,
): DetailsRegionFonts {
  return {
    title: display,
    sideLabel: display,
    parentName: body,
    invitation: body,
    names,
    role: body,
    ampersand: accent,
    time: body,
    /* Không phải `display`: số ngày là bậc chữ lớn nhất khối, nên bộ số oldstyle
       của serif display lộ ra rõ nhất đúng ở đây. */
    dateNumber: numeral,
    dateUnit: body,
    lunar: body,
    venueLabel: body,
    venue: display,
    address: body,
    action: body,
  };
}

/**
 * Bốn combo, mỗi combo đọc lại một ảnh trong `docs/shares/combo-font/` bằng
 * font tiếng Việt có sẵn của dự án. Tên combo lấy theo **font đặt tên cặp đôi**
 * vì đó là thứ người chọn mẫu nhìn thấy trước tiên.
 */
export const DETAILS_FONT_COMBOS = {
  /** font-2: thư pháp copperplate trên serif old-style. */
  "great-vibes": combo(
    "great-vibes",
    "great-vibes",
    "cormorant-sc",
    "eb-garamond",
    "eb-garamond",
  ),
  /** font-4: thư pháp Việt, nhãn bằng sans — combo duy nhất có sans. */
  "uvn-hoa-tay": combo(
    "uvn-hoa-tay",
    "great-vibes",
    "cormorant-sc",
    "be-vietnam-pro",
    "be-vietnam-pro",
  ),
  /** Thư pháp mảnh, cần serif có thân chữ chắc đỡ bên dưới. */
  "arcittya-begatri": combo(
    "arcittya-begatri",
    "great-vibes",
    "playfair-display",
    "lora",
    "eb-garamond",
  ),
  /** font-1 và font-3: không có chữ viết tay, tên đặt bằng serif tương phản cao. */
  "playfair-display": combo(
    "playfair-display",
    "great-vibes",
    "cormorant-sc",
    "eb-garamond",
    "eb-garamond",
  ),
} as const;
export type DetailsFontCombo = keyof typeof DETAILS_FONT_COMBOS;

export type DetailsTypography = {
  combo?: DetailsFontCombo;
  /**
   * Đè lên combo cho từng vùng. Nhận **id trong `DETAILS_FONTS`** hoặc một
   * chuỗi `font-family` CSS bất kỳ — nhánh thứ hai để mẫu dùng font riêng của
   * chính nó mà không phải đăng ký vào registry dùng chung.
   */
  regions?: DetailsRegionFonts;
};

/**
 * Trả về class biến font và các biến CSS cho từng vùng. Chỉ những vùng thật sự
 * được khai mới sinh biến — vùng bỏ trống kế thừa font của mẫu, đúng như
 * `opening-typography`.
 */
export function detailsTypography(typography?: DetailsTypography) {
  const fonts: DetailsRegionFonts = {
    ...(typography?.combo ? DETAILS_FONT_COMBOS[typography.combo] : {}),
  };
  for (const region of DETAILS_TEXT_REGIONS) {
    const font = typography?.regions?.[region]?.trim();
    if (font) fonts[region] = font;
  }

  /* Chốt chặn: vùng chỉ chứa chữ số không bao giờ nhận font oldstyle, kể cả khi
     mẫu tự khai đè. Ràng buộc chứ không phải quy ước. */
  for (const region of NUMERIC_REGIONS) {
    const font = fonts[region];
    if (font && !isLining(font)) fonts[region] = NUMERAL_FALLBACK;
  }

  const variables = new Set<string>();
  const style: Record<string, string> = {};
  for (const region of DETAILS_TEXT_REGIONS) {
    const font = fonts[region];
    if (!font) continue;
    const registered = Object.prototype.hasOwnProperty.call(DETAILS_FONTS, font)
      ? DETAILS_FONTS[font as DetailsFontId]
      : undefined;
    if (registered) variables.add(registered.variable);
    style[`--details-font-${kebab(region)}`] = registered?.family ?? font;
  }
  return { className: [...variables].join(" "), style: style as CSSProperties };
}

function kebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
