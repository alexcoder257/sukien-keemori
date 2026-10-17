import localFont from "next/font/local";

/** Sans tiếng Việt cho body, label và template hiện đại/chibi. */
export const beVietnamPro = localFont({
  src: [
    { path: "./bevietnampro-thin.woff2", weight: "100", style: "normal" },
    { path: "./bevietnampro-thinitalic.woff2", weight: "100", style: "italic" },
    { path: "./bevietnampro-extralight.woff2", weight: "200", style: "normal" },
    {
      path: "./bevietnampro-extralightitalic.woff2",
      weight: "200",
      style: "italic",
    },
    { path: "./bevietnampro-light.woff2", weight: "300", style: "normal" },
    {
      path: "./bevietnampro-lightitalic.woff2",
      weight: "300",
      style: "italic",
    },
    { path: "./bevietnampro-regular.woff2", weight: "400", style: "normal" },
    { path: "./bevietnampro-italic.woff2", weight: "400", style: "italic" },
    { path: "./bevietnampro-medium.woff2", weight: "500", style: "normal" },
    {
      path: "./bevietnampro-mediumitalic.woff2",
      weight: "500",
      style: "italic",
    },
    { path: "./bevietnampro-semibold.woff2", weight: "600", style: "normal" },
    {
      path: "./bevietnampro-semibolditalic.woff2",
      weight: "600",
      style: "italic",
    },
    { path: "./bevietnampro-bold.woff2", weight: "700", style: "normal" },
    { path: "./bevietnampro-bolditalic.woff2", weight: "700", style: "italic" },
    { path: "./bevietnampro-extrabold.woff2", weight: "800", style: "normal" },
    {
      path: "./bevietnampro-extrabolditalic.woff2",
      weight: "800",
      style: "italic",
    },
    { path: "./bevietnampro-black.woff2", weight: "900", style: "normal" },
    {
      path: "./bevietnampro-blackitalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-be-vietnam-pro",
  display: "swap",
  preload: false,
});
