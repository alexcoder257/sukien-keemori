import localFont from "next/font/local";

/** Self-hosted typeface from the Doha reference, used by Nắng Hẹn. */
export const hastegi = localFont({
  src: "./hastegi.otf",
  weight: "400",
  variable: "--font-hastegi",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
