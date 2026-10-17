import localFont from "next/font/local";

/** Botanical formal — tiêu đề small caps. */
export const cormorantSc = localFont({
  src: [
    { path: "./cormorantsc-light.woff2", weight: "300" },
    { path: "./cormorantsc-regular.woff2", weight: "400" },
    { path: "./cormorantsc-medium.woff2", weight: "500" },
    { path: "./cormorantsc-semibold.woff2", weight: "600" },
    { path: "./cormorantsc-bold.woff2", weight: "700" },
  ],
  variable: "--font-cormorant-sc",
  style: "normal",
  display: "swap",
  preload: false,
});
