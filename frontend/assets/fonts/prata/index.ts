import localFont from "next/font/local";

/** Dark luxury — display serif. */
export const prata = localFont({
  src: "./prata-regular.woff2",
  variable: "--font-prata",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: false,
});
