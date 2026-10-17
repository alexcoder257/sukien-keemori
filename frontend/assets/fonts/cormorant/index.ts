import localFont from "next/font/local";

/** Botanical formal / Dark luxury — serif cho heading và body. */
export const cormorant = localFont({
  src: [
    { path: "./cormorantwght.woff2", weight: "300 700", style: "normal" },
    {
      path: "./cormorant-italicwght.woff2",
      weight: "300 700",
      style: "italic",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});
