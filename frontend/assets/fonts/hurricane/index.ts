import localFont from "next/font/local";

/** Brush handwriting for short cover titles; includes Vietnamese glyphs. */
export const hurricane = localFont({
  src: "./hurricane-regular.woff2",
  weight: "400",
  variable: "--font-hurricane",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
