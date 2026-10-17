/** Bộ nhận diện Keemori dùng chung cho UI, metadata và structured data. */
export const BRAND_TAGLINE = "KEEP YOUR MEMORIES, BEAUTIFULLY.";

/**
 * Tên miền dạng chữ, dùng làm dấu bản quyền ở chân mọi tấm thiệp
 * (`invitation-signature.tsx`). Là **chữ của thương hiệu**, không phải URL cấu
 * hình — nên nó nằm ở đây chứ không phải biến môi trường, và link đi kèm là
 * đường dẫn tương đối `/` để bản deploy nào cũng trỏ về chính nó.
 */
export const BRAND_DOMAIN = "keemori.com";

export const BRAND_ASSETS = {
  logo: {
    horizontal: {
      darkSurface: "/images/site/brand/logo-horizontal-gold.png",
      lightSurface: "/images/site/brand/logo-horizontal-ink.png",
    },
    stacked: {
      darkSurface: "/images/site/brand/logo-stacked-gold.png",
      lightSurface: "/images/site/brand/logo-stacked-ink.png",
    },
  },
  icon: {
    darkSurface: "/images/site/brand/favicon-light.png",
    lightSurface: "/images/site/brand/favicon-light.png",
  },
  /**
   * Bản thu nhỏ của `icon` cho tab trình duyệt, cắt từ chính `favicon-light.png`.
   *
   * Tab chỉ vẽ 16–32px, mà bản gốc 512px nặng 307KB và bị tải trên **mọi**
   * trang — trên 3G là ~6 giây giành đường truyền với nội dung thật. Bản gốc chỉ
   * còn làm `apple-touch-icon` (tải khi thêm vào màn hình chính). Đổi logo thì
   * cắt lại hai file này; không nén bằng bảng màu — đã thử, nét vàng dưới chữ K
   * bị lượng tử hoá thành xám.
   */
  favicon: {
    small: "/images/site/brand/favicon-48.png",
    medium: "/images/site/brand/favicon-192.png",
  },
  openGraph: {
    dark: "/images/site/brand/opengraph-dark.jpg",
    light: "/images/site/brand/opengraph-light.jpg",
  },
} as const;
