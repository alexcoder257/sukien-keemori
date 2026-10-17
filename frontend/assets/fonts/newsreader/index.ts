import localFont from "next/font/local";

/** Wedding newspaper — editorial heading. */
export const newsreader = localFont({
  src: [
    { path: "./newsreaderopsz-wght.woff2", weight: "200 800", style: "normal" },
    {
      path: "./newsreader-italicopsz-wght.woff2",
      weight: "200 800",
      style: "italic",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
  preload: false,
});
