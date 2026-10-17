import type { NextConfig } from "next";
import { API_BASE_URL } from "./apis/config";

/**
 * Nơi `/uploads/*` thật sự nằm. Mặc định là backend (đĩa local, hợp cho dev);
 * khi `STORAGE_DRIVER=r2` ở backend thì trỏ biến này sang custom domain của
 * bucket R2, ví dụ `https://cdn.tenmien.com`.
 *
 * Backend luôn trả đường dẫn **tương đối** dù lưu ở đâu (xem `R2Provider`), nên
 * chuyển sang CDN không phải backfill dữ liệu đã ghi.
 */
// `||` chứ không phải `??`: `.env` để `UPLOADS_ORIGIN=` trống sẽ ra chuỗi rỗng,
// mà `??` coi chuỗi rỗng là giá trị hợp lệ và rewrite sẽ trỏ vào hư không.
const UPLOADS_ORIGIN = process.env.UPLOADS_ORIGIN || API_BASE_URL;

/**
 * Nơi ảnh tĩnh của kho mẫu (`/images/templates/<slug>/poster.avif`) thật sự
 * nằm: thư mục `public/` của **`frontend/`**, không phải của CMS.
 *
 * CMS cần chúng để người vận hành *nhìn thấy* thiệp mình đang chọn — một danh
 * sách toàn chữ thì không ai biết "Tin Vui" trông ra sao. Copy ảnh sang
 * `dashboard/public/` là nhân đôi vài chục MB và sẽ lệch ngay lần đổi mẫu kế
 * tiếp, nên rewrite sang frontend.
 *
 * Next ghi rewrite vào routes-manifest.json lúc build. SITE_ORIGIN phải có
 * ngay trong bước build Docker/CI; chỉ đặt trong environment lúc chạy là muộn.
 */
const SITE_ORIGIN = process.env.SITE_ORIGIN || "http://localhost:3000";

const nextConfig: NextConfig = {
  /* Tắt huy hiệu dev của Next.js: nó nổi đè lên thiệp và lọt vào cả ảnh chụp
     màn hình khi review giao diện. Lỗi biên dịch/runtime vẫn hiện như cũ. */
  devIndicators: false,

  /**
   * Bảng Thiệp hiện link đầy đủ của từng thiệp (`lib/card-preview.ts`), nên
   * component client cần biết gốc trang khách. Production build đặt
   * `SITE_ORIGIN` bằng `PUBLIC_WEB_URL` (tên miền công khai), và `env` đóng
   * băng giá trị vào bundle lúc build — cùng thời điểm với rewrite bên dưới.
   */
  env: { SITE_ORIGIN },

  /**
   * Ảnh tải lên nằm trên đĩa của backend, serve ở `/uploads`. CMS cần rewrite
   * này để **bản xem trước hiện đúng ảnh vừa tải**: đường dẫn lưu trong bài là
   * tương đối (xem `apis/upload.ts`), nên không có rewrite thì trình duyệt đi
   * tìm ảnh ở cổng 3002 và nhận 404.
   *
   * `frontend/next.config.ts` có cùng rewrite này — bản sao có chủ đích, giống
   * `apis/http.ts` và `constants/role.ts`.
   */
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: `${UPLOADS_ORIGIN}/uploads/:path*` },
      { source: "/images/:path*", destination: `${SITE_ORIGIN}/images/:path*` },
    ];
  },
};

export default nextConfig;
