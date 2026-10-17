import localFont from "next/font/local";

/** Watercolor garden — heading serif. */
export const ebGaramond = localFont({
  src: [
    { path: "./ebgaramondwght.woff2", weight: "400 800", style: "normal" },
    {
      path: "./ebgaramond-italicwght.woff2",
      weight: "400 800",
      style: "italic",
    },
  ],
  variable: "--font-eb-garamond",
  display: "swap",
  preload: false,
});

/**
 * Chỉ chữ số và dấu hai chấm của EB Garamond (`unicode-range`). Đặt family này
 * **đứng đầu** một font stack thì mọi chữ số trong phạm vi đó ra EB Garamond,
 * còn chữ cái rơi xuống font kế tiếp — mẫu đổi bộ số mà không phải bọc từng con
 * số vào một thẻ riêng.
 */
export const ebGaramondDigits = localFont({
  src: [{ path: "./ebgaramondwght.woff2", weight: "400 800", style: "normal" }],
  variable: "--font-eb-garamond-digits",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0030-003A" }],
});
