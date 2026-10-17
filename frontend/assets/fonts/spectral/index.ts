import localFont from "next/font/local";

/** Wedding newspaper — serif body. */
export const spectral = localFont({
  src: [
    { path: "./spectral-extralight.woff2", weight: "200", style: "normal" },
    {
      path: "./spectral-extralightitalic.woff2",
      weight: "200",
      style: "italic",
    },
    { path: "./spectral-light.woff2", weight: "300", style: "normal" },
    { path: "./spectral-lightitalic.woff2", weight: "300", style: "italic" },
    { path: "./spectral-regular.woff2", weight: "400", style: "normal" },
    { path: "./spectral-italic.woff2", weight: "400", style: "italic" },
    { path: "./spectral-medium.woff2", weight: "500", style: "normal" },
    { path: "./spectral-mediumitalic.woff2", weight: "500", style: "italic" },
    { path: "./spectral-semibold.woff2", weight: "600", style: "normal" },
    { path: "./spectral-semibolditalic.woff2", weight: "600", style: "italic" },
    { path: "./spectral-bold.woff2", weight: "700", style: "normal" },
    { path: "./spectral-bolditalic.woff2", weight: "700", style: "italic" },
    { path: "./spectral-extrabold.woff2", weight: "800", style: "normal" },
    {
      path: "./spectral-extrabolditalic.woff2",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-spectral",
  display: "swap",
  preload: false,
});
