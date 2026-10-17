import localFont from "next/font/local";

/** Editorial heading; hiện cũng dùng trong The Invitation Reveal. */
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
