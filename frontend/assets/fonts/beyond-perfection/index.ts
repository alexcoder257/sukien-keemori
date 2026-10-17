import localFont from "next/font/local";

/** Self-hosted typeface from the Doha reference, used by Nắng Hẹn. */
export const beyondPerfection = localFont({
  src: "./beyond-perfection.ttf",
  weight: "400",
  variable: "--font-beyond-perfection",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
