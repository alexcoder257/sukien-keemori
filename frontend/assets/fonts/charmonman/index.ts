import localFont from "next/font/local";

/** Watercolor garden — tên cặp đôi. */
export const charmonman = localFont({
  src: [
    { path: "./charmonman-regular.woff2", weight: "400" },
    { path: "./charmonman-bold.woff2", weight: "700" },
  ],
  variable: "--font-charmonman",
  style: "normal",
  display: "swap",
  preload: false,
});
