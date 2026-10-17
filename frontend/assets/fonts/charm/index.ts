import localFont from "next/font/local";

/** Winter / Aurora — display script. */
export const charm = localFont({
  src: [
    { path: "./charm-regular.woff2", weight: "400" },
    { path: "./charm-bold.woff2", weight: "700" },
  ],
  variable: "--font-charm",
  style: "normal",
  display: "swap",
  preload: false,
});
