import localFont from "next/font/local";

/** Destination editorial — tên cặp đôi và hero. */
export const momoSignature = localFont({
  src: "./momosignature-regular.woff2",
  variable: "--font-momo-signature",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: false,
});
