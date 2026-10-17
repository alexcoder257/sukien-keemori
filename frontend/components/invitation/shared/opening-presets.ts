import type { CSSProperties } from "react";

/** Structural variants; palettes are deliberately independent from the variant. */
export const OPENING_VARIANTS = [
  { id: "ceremony-classic", concept: "ceremony", motion: "paper-bloom" },
  { id: "ceremony-arch", concept: "ceremony", motion: "paper-lift" },
  { id: "ceremony-gate", concept: "ceremony", motion: "fade" },
  { id: "envelope-botanical", concept: "envelope", motion: "paper-lift" },
  { id: "envelope-bouquet", concept: "envelope", motion: "paper-bloom" },
  { id: "envelope-ribbon", concept: "envelope", motion: "paper-lift" },
  { id: "linen-fold", concept: "linen", motion: "fade" },
  { id: "linen-vellum", concept: "linen", motion: "paper-lift" },
  { id: "linen-pressed", concept: "linen", motion: "paper-bloom" },
] as const;

export type OpeningVariant = (typeof OPENING_VARIANTS)[number]["id"];
export type OpeningConcept = (typeof OPENING_VARIANTS)[number]["concept"];
export type OpeningPalette = {
  background: string;
  paper: string;
  ink: string;
  accent: string;
  seal: string;
  onSeal: string;
  botanical: string;
};

export const OPENING_PALETTES = {
  ceremony: {
    background: "#380c13",
    paper: "#7a1626",
    ink: "#fff0d4",
    accent: "#d8b675",
    seal: "#dfbf86",
    onSeal: "#4c1420",
    botanical: "#d8b675",
  },
  envelope: {
    background: "#eeeee6",
    paper: "#fbfbf7",
    ink: "#344333",
    accent: "#8c774a",
    seal: "#455c3a",
    onSeal: "#fff8e8",
    botanical: "#697e51",
  },
  linen: {
    background: "#e5ddd0",
    paper: "#f5eddd",
    ink: "#65472d",
    accent: "#a07b49",
    seal: "#88603b",
    onSeal: "#fff3d9",
    botanical: "#8c9063",
  },
} satisfies Record<OpeningConcept, OpeningPalette>;

export const OPENING_MOTIFS = [
  "double-happiness",
  "flower",
  "sprig",
  "heart",
  "diamond",
  "none",
] as const;
export type OpeningMotif = (typeof OPENING_MOTIFS)[number];
export type OpeningDecor = {
  corner: OpeningMotif;
  divider: OpeningMotif;
  ambient: OpeningMotif;
};
export const OPENING_DECOR = {
  ceremony: {
    corner: "double-happiness",
    divider: "flower",
    ambient: "diamond",
  },
  envelope: { corner: "none", divider: "none", ambient: "diamond" },
  linen: { corner: "none", divider: "none", ambient: "diamond" },
} satisfies Record<OpeningConcept, OpeningDecor>;

export function openingColorStyle(colors?: Partial<OpeningPalette>): CSSProperties {
  return Object.fromEntries(
    Object.entries(colors ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        `--opening-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        value,
      ]),
  ) as CSSProperties;
}
