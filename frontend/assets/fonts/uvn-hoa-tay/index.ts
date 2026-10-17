import localFont from "next/font/local";

/** Self-hosted typeface from the Doha reference, used by Nắng Hẹn. */
export const uvnHoaTay = localFont({
  src: "./uvn-hoa-tay.ttf",
  weight: "400",
  variable: "--font-uvn-hoa-tay",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
