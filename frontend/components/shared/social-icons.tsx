import type { SVGProps } from "react";

/**
 * Biểu tượng mạng xã hội **một màu** (`currentColor`), cho chân trang.
 *
 * Tách khỏi `components/auth/brand-icons.tsx` có chủ đích: bản ở đó là logo
 * đầy màu cho nút đăng nhập (Facebook xanh `#1877F2`), còn chân trang nằm trên
 * bề mặt tối và cả hàng biểu tượng phải ăn theo token chữ — một logo xanh giữa
 * nền đen champagne là một mảng màu lạc khỏi bảng 7 màu.
 *
 * `lucide-react` 1.x đã bỏ toàn bộ logo thương hiệu, nên các hình dưới đây vẽ
 * tay theo hình dạng chính thức của từng hãng.
 */
type IconProps = SVGProps<SVGSVGElement>;

export function FacebookGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M9.1 23.7v-8H6.6V12h2.5v-1.6c0-4.1 1.8-6 5.9-6 .8 0 2.1.2 2.6.3v3.3l-1.4-.1c-2 0-2.7.8-2.7 2.7V12h3.9l-.7 3.7h-3.2V24C19.4 23.2 24 18.2 24 12 24 5.4 18.6 0 12 0S0 5.4 0 12c0 5.6 3.9 10.4 9.1 11.7Z" />
    </svg>
  );
}

export function InstagramGlyph(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TiktokGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
    </svg>
  );
}

/**
 * Bong bóng chat có chữ "Zalo" khoét rỗng — dáng icon app, không phải chữ
 * trần: chữ "Zalo" đứng một mình ở 20px chỉ cao 7px và nhẹ hẳn so với logo
 * Facebook đặc bên cạnh. Chữ lấy từ Simple Icons (CC0), thu nhỏ vào lòng bong
 * bóng.
 *
 * Một `path` với `evenodd` thay vì `<mask>`: mask cần `id`, mà biểu tượng này
 * xuất hiện nhiều lần trên cùng một trang (chân trang, trang Liên hệ).
 */
export function ZaloGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path
        fillRule="evenodd"
        d="M6.5 1h11a6 6 0 0 1 6 6v7a6 6 0 0 1-6 6H9.4l-4.6 3.1c-.55.37-1.2-.08-1.05-.7l.55-2.45A6 6 0 0 1 .5 14V7a6 6 0 0 1 6-6Z M12.353 9.256 v-0.324 h0.97 v4.552 h-0.555 a0.415 0.415 0 0 1 -0.415 -0.412 l-0 0 a2.357 2.357 0 0 1 -1.395 0.455 c-1.306 0 -2.365 -1.058 -2.365 -2.363 0 -1.305 1.059 -2.363 2.365 -2.363 a2.357 2.357 0 0 1 1.395 0.455 l0 0 zM8.342 7.469 v0.148 c0 0.275 -0.037 0.5 -0.216 0.764 l-0.022 0.025 c-0.039 0.044 -0.131 0.148 -0.174 0.205 L4.817 12.516 h3.524 v0.553 a0.415 0.415 0 0 1 -0.415 0.415 H3.36 v-0.261 c0 -0.319 0.079 -0.462 0.18 -0.61 L6.858 8.506 H3.498 V7.469 h4.843 zm6.157 6.015 a0.346 0.346 0 0 1 -0.346 -0.345 v-5.67 h1.038 v6.015 H14.498 zM18.259 8.772 C19.574 8.772 20.64 9.838 20.64 11.151 c0 1.314 -1.066 2.38 -2.381 2.38 -1.315 0 -2.381 -1.066 -2.381 -2.38 0 -1.313 1.066 -2.379 2.381 -2.379 zm-7.302 3.782 c0.769 0 1.391 -0.622 1.391 -1.39 0 -0.767 -0.623 -1.389 -1.391 -1.389 s-1.391 0.622 -1.391 1.389 c0 0.768 0.623 1.39 1.391 1.39 zm7.302 -0.002 c0.773 0 1.4 -0.627 1.4 -1.401 0 -0.773 -0.627 -1.399 -1.4 -1.399 -0.774 0 -1.4 0.627 -1.4 1.399 0 0.774 0.626 1.401 1.4 1.401 z"
      />
    </svg>
  );
}
