import localFont from "next/font/local";

/** Font UI mặc định của ứng dụng. */
export const inter = localFont({
  src: "./inter-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
});
