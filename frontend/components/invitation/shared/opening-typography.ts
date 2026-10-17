import type { CSSProperties } from "react";
import {
  beyondPerfection,
  hastegi,
  lora,
  greatVibes,
  cormorant,
  ebGaramond,
  uvnHoaTay,
  beVietnamPro,
} from "@/assets/fonts";

/** `lining` follows the local glyph measurements, as in details/ceremonies. */
export const OPENING_FONTS = {
  hastegi: {
    label: "Hastegi",
    lining: true,
    family: "var(--font-hastegi), Georgia, serif",
    variable: hastegi.variable,
  },
  "beyond-perfection": {
    label: "Beyond Perfection",
    lining: false,
    family: "var(--font-beyond-perfection), cursive",
    variable: beyondPerfection.variable,
  },
  lora: {
    label: "Lora",
    lining: false,
    family: "var(--font-lora), Georgia, serif",
    variable: lora.variable,
  },
  cormorant: {
    label: "Cormorant",
    lining: false,
    family: "var(--font-cormorant), Georgia, serif",
    variable: cormorant.variable,
  },
  "eb-garamond": {
    label: "EB Garamond",
    lining: true,
    family: "var(--font-eb-garamond), Georgia, serif",
    variable: ebGaramond.variable,
  },
  "great-vibes": {
    label: "Great Vibes",
    lining: false,
    family: "var(--font-great-vibes), cursive",
    variable: greatVibes.variable,
  },
  "uvn-hoa-tay": {
    label: "UVN Hoa Tay",
    lining: true,
    family: "var(--font-uvn-hoa-tay), cursive",
    variable: uvnHoaTay.variable,
  },
  "be-vietnam-pro": {
    label: "Be Vietnam Pro",
    lining: true,
    family: "var(--font-be-vietnam-pro), sans-serif",
    variable: beVietnamPro.variable,
  },
} as const;
export const OPENING_TEXT_REGIONS = [
  "firstName",
  "secondName",
  "ampersand",
  "invitation",
  "date",
  "monogram",
  "heading",
  "headingAccent",
  "action",
] as const;
export type OpeningTextRegion = (typeof OPENING_TEXT_REGIONS)[number];
type OpeningFontId = keyof typeof OPENING_FONTS;
/** Registered IDs appear in autocomplete; CSS font-family remains supported. */
export type OpeningFontValue = OpeningFontId | (string & {});
export type OpeningRegionFonts = Partial<
  Record<OpeningTextRegion, OpeningFontValue>
>;

const NUMERAL_FALLBACK: OpeningFontId = "eb-garamond";

function isLining(font: string): boolean {
  return Object.prototype.hasOwnProperty.call(OPENING_FONTS, font)
    ? OPENING_FONTS[font as OpeningFontId].lining
    : true; // Custom CSS families remain the template author's responsibility.
}

function combo(
  names: OpeningFontId,
  accent: OpeningFontId,
  display: OpeningFontId,
  body: OpeningFontId,
  numeral: OpeningFontId,
): OpeningRegionFonts {
  return {
    firstName: names,
    secondName: names,
    ampersand: accent,
    invitation: body,
    date: numeral,
    monogram: display,
    heading: display,
    headingAccent: accent,
    action: body,
  };
}
/** Interpretations of font-1.jpg … font-4.jpg using the project's local Vietnamese fonts. */
export const OPENING_FONT_COMBOS = {
  "reference-1": combo(
    "hastegi",
    "beyond-perfection",
    "hastegi",
    "lora",
    "eb-garamond",
  ),
  "reference-2": combo(
    "beyond-perfection",
    "beyond-perfection",
    "hastegi",
    "lora",
    "eb-garamond",
  ),
  "reference-3": combo(
    "cormorant",
    "great-vibes",
    "cormorant",
    "eb-garamond",
    "eb-garamond",
  ),
  "reference-4": combo(
    "uvn-hoa-tay",
    "great-vibes",
    "hastegi",
    "be-vietnam-pro",
    "be-vietnam-pro",
  ),
} as const;
export type OpeningFontCombo = keyof typeof OPENING_FONT_COMBOS;
export type OpeningTypography = {
  combo?: OpeningFontCombo;
  /** Registered font ID or a CSS font-family; blank values inherit the combo/template. */
  regions?: OpeningRegionFonts;
};

export function openingTypography(typography?: OpeningTypography) {
  const fonts: OpeningRegionFonts = {
    date: NUMERAL_FALLBACK,
    ...(typography?.combo ? OPENING_FONT_COMBOS[typography.combo] : {}),
  };
  for (const region of OPENING_TEXT_REGIONS) {
    const font = typography?.regions?.[region]?.trim();
    if (font) fonts[region] = font;
  }
  // Cover dates need even-height digits, including explicit region overrides.
  if (fonts.date && !isLining(fonts.date)) fonts.date = NUMERAL_FALLBACK;
  const variables = new Set<string>();
  const style: Record<string, string> = {};
  for (const region of OPENING_TEXT_REGIONS) {
    const font = fonts[region];
    if (!font) continue;
    // Beyond Perfection has unusually wide calligraphic swashes. Normalize
    // name sizing while retaining the template's responsive type scale.
    if (region === "firstName" || region === "secondName") {
      const role = region === "firstName" ? "first-name" : "second-name";
      style[`--opening-font-${role}-scale`] =
        font === "beyond-perfection" ? "0.75" : "1";
    }
    const registered = Object.prototype.hasOwnProperty.call(OPENING_FONTS, font)
      ? OPENING_FONTS[font as keyof typeof OPENING_FONTS]
      : undefined;
    if (registered) variables.add(registered.variable);
    style[
      `--opening-font-${region.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
    ] = registered?.family ?? font;
  }
  return { className: [...variables].join(" "), style: style as CSSProperties };
}
