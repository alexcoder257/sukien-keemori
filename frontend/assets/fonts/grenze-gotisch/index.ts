import localFont from "next/font/local";

/** Wedding newspaper — masthead blackletter. */
export const grenzeGotisch = localFont({
  src: "./grenzegotischwght.woff2",
  variable: "--font-grenze-gotisch",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
});
