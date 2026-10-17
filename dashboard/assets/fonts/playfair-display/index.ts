import localFont from "next/font/local";

/**
 * Serif thương hiệu — **chỉ** trang đăng nhập dùng. Bản sao tệp font của
 * `frontend/assets/fonts/playfair-display/`.
 */
export const playfairDisplay = localFont({
  src: [
    {
      path: "./playfair-display-variable.woff2",
      weight: "400 900",
      style: "normal",
    },
    {
      path: "./playfairdisplay-italicwght.woff2",
      weight: "400 900",
      style: "italic",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
});
