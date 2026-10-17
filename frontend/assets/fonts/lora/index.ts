import localFont from "next/font/local";

/** Watercolor garden — body serif. */
export const lora = localFont({
  src: [
    { path: "./lorawght.woff2", weight: "400 700", style: "normal" },
    { path: "./lora-italicwght.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});
