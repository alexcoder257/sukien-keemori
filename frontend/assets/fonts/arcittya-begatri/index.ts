import localFont from "next/font/local";

/** Self-hosted typeface from the Doha reference, used by Nắng Hẹn. */
export const arcittyaBegatri = localFont({
  src: "./arcittya-begatri.otf",
  weight: "400",
  variable: "--font-arcittya-begatri",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
