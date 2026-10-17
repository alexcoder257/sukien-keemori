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
 * Typography của khối nghi lễ — cùng hợp đồng với `details-typography.ts`.
 *
 * **Tên combo trùng khớp với bên details là có chủ đích**: một mẫu chọn cùng
 * một id cho cả hai khối thì được hai khối cùng ngôn ngữ chữ, không phải nhớ
 * cặp nào đi với cặp nào.
 */

/**
 * `lining` — bộ chữ số **cao đều nhau và đứng trên đường chân chữ**.
 *
 * Serif display cổ điển mặc định dùng chữ số *oldstyle*: 0 và 2 thấp bằng thân
 * chữ, 8 vươn cao, 3/5/7/9 thòng xuống dưới. Đẹp khi nằm lẫn trong câu, nhưng
 * "08:00" viết bằng bộ đó thì bốn con số cao thấp so le và giờ giấc đọc ra như
 * lỗi in. Đo bằng fontTools trên chính file font: Cormorant SC lệch **131‰ em**
 * giữa số cao nhất và thấp nhất, Playfair 204‰, Cormorant 265‰ — trong khi
 * EB Garamond chỉ 16‰ và Be Vietnam Pro 10‰.
 *
 * Cờ này là dữ liệu đo được, không phải ý kiến: cập nhật khi thay file font.
 */
export const CEREMONIES_FONTS = {
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

export type CeremoniesFontId = keyof typeof CEREMONIES_FONTS;

/** Vùng chữ, chia theo **vai trong nội dung** chứ không theo thẻ HTML. */
export const CEREMONIES_TEXT_REGIONS = [
  "title",
  "name",
  "time",
  "date",
  "venue",
  "note",
] as const;
export type CeremoniesTextRegion = (typeof CEREMONIES_TEXT_REGIONS)[number];
/** Id đã đăng ký hiện ra trong gợi ý; chuỗi `font-family` CSS vẫn nhận được. */
export type CeremoniesFontValue = CeremoniesFontId | (string & {});
export type CeremoniesRegionFonts = Partial<
  Record<CeremoniesTextRegion, CeremoniesFontValue>
>;

/**
 * Vùng chữ **chỉ chứa chữ số**. Font gán vào đây bắt buộc phải có `lining`.
 *
 * Khai thành danh sách chứ không kiểm tại chỗ, để thêm một vùng số mới thì luật
 * tự áp dụng thay vì phải nhớ đi thêm một câu `if`.
 */
const NUMERIC_REGIONS: readonly CeremoniesTextRegion[] = ["time"];

/** Rơi về đây khi vùng số bị gán một font oldstyle. Có `lining`, và trung tính. */
const NUMERAL_FALLBACK: CeremoniesFontId = "eb-garamond";

function isLining(font: string): boolean {
  return Object.prototype.hasOwnProperty.call(CEREMONIES_FONTS, font)
    ? CEREMONIES_FONTS[font as CeremoniesFontId].lining
    : /* Chuỗi `font-family` tự do thì không tra được — tin vào người khai. */ true;
}

/**
 * Một combo khai **bốn vai** — accent (măng sét), display (tên nghi lễ), body,
 * và **numeral**.
 *
 * `numeral` tách riêng khỏi `display` vì đúng một lý do: serif display đẹp nhất
 * ở cỡ lớn lại thường mang bộ chữ số oldstyle, mà giờ giấc thì phải cao đều.
 * Gộp hai vai vào nhau là buộc phải chọn giữa "tên nghi lễ đẹp" và "giờ đọc
 * được".
 */
function combo(
  accent: CeremoniesFontId,
  display: CeremoniesFontId,
  body: CeremoniesFontId,
  numeral: CeremoniesFontId,
): CeremoniesRegionFonts {
  return {
    title: accent,
    name: display,
    time: numeral,
    date: body,
    venue: body,
    note: body,
  };
}

export const CEREMONIES_FONT_COMBOS = {
  "great-vibes": combo(
    "great-vibes",
    "cormorant-sc",
    "eb-garamond",
    "eb-garamond",
  ),
  "uvn-hoa-tay": combo(
    "uvn-hoa-tay",
    "cormorant-sc",
    "be-vietnam-pro",
    "be-vietnam-pro",
  ),
  /* Body là Lora, nhưng chữ số của Lora lệch 65‰ nên vai numeral đi đường khác. */
  "arcittya-begatri": combo(
    "arcittya-begatri",
    "playfair-display",
    "lora",
    "eb-garamond",
  ),
  "playfair-display": combo(
    "great-vibes",
    "playfair-display",
    "eb-garamond",
    "eb-garamond",
  ),
} as const;
export type CeremoniesFontCombo = keyof typeof CEREMONIES_FONT_COMBOS;

export type CeremoniesTypography = {
  combo?: CeremoniesFontCombo;
  /**
   * Đè lên combo cho từng vùng. Nhận id trong `CEREMONIES_FONTS` hoặc một chuỗi
   * `font-family` CSS bất kỳ — nhánh thứ hai để mẫu dùng font riêng của chính
   * nó mà không phải đăng ký vào registry dùng chung.
   */
  regions?: CeremoniesRegionFonts;
};

export function ceremoniesTypography(typography?: CeremoniesTypography) {
  const fonts: CeremoniesRegionFonts = {
    ...(typography?.combo ? CEREMONIES_FONT_COMBOS[typography.combo] : {}),
  };
  for (const region of CEREMONIES_TEXT_REGIONS) {
    const font = typography?.regions?.[region]?.trim();
    if (font) fonts[region] = font;
  }

  /**
   * Chốt chặn: vùng chỉ chứa chữ số **không bao giờ** nhận font oldstyle, kể cả
   * khi mẫu tự khai đè. Đây là chỗ khác giữa một quy ước và một ràng buộc — quy
   * ước thì lần sau có người phá, còn ở đây font sai bị thay tại chỗ.
   */
  for (const region of NUMERIC_REGIONS) {
    const font = fonts[region];
    if (font && !isLining(font)) fonts[region] = NUMERAL_FALLBACK;
  }

  const variables = new Set<string>();
  const style: Record<string, string> = {};
  for (const region of CEREMONIES_TEXT_REGIONS) {
    const font = fonts[region];
    if (!font) continue;
    const registered = Object.prototype.hasOwnProperty.call(
      CEREMONIES_FONTS,
      font,
    )
      ? CEREMONIES_FONTS[font as CeremoniesFontId]
      : undefined;
    if (registered) variables.add(registered.variable);
    style[`--ceremony-font-${region}`] = registered?.family ?? font;
  }
  return { className: [...variables].join(" "), style: style as CSSProperties };
}
