import type { NextConfig } from "next";
import { API_BASE_URL } from "./apis/config";
import { OPENING_IMAGE_SIZES } from "./constants/opening-artwork";

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

const nextConfig: NextConfig = {
  /**
   * Ảnh tải lên nằm trên đĩa của **backend** và được serve ở `/uploads`
   * (`backend/src/main.ts`), tức một origin khác với trang khách. Rewrite này
   * kéo chúng về cùng origin để đường dẫn lưu trong cơ sở dữ liệu là **đường
   * dẫn tương đối**, không phải URL tuyệt đối.
   *
   * Đó không phải chuyện thẩm mỹ: lưu tuyệt đối thì mỗi lần đổi tên miền hay
   * chuyển sang CDN là phải sửa lại dữ liệu đã ghi trong cơ sở dữ liệu.
   */
  /**
   * `/khieu-nai` đã được gộp vào Điều khoản sử dụng (mục "Khiếu nại và giải
   * quyết tranh chấp"). Đường dẫn cũ đã từng được công bố trong chính các văn
   * bản pháp lý và có thể đã lọt vào chỉ mục tìm kiếm, nên nó phải tiếp tục
   * mở được — một link pháp lý chết là thứ người dùng gặp đúng lúc họ đang cần
   * khiếu nại.
   *
   * Trỏ về đầu trang chứ không vào neo: id của neo dựng từ chính chữ tiêu đề
   * nên mỗi locale một khác, mà rewrite/redirect thì không đổi hash theo
   * `:locale` được. Mục lục dính bên trái đưa nốt quãng còn lại.
   */
  async redirects() {
    return [
      {
        source: "/:locale/khieu-nai",
        destination: "/:locale/dieu-khoan",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${UPLOADS_ORIGIN}/uploads/:path*`,
      },
    ];
  },
  /* Tắt huy hiệu dev của Next.js: nó nổi đè lên thiệp và lọt vào cả ảnh chụp
     màn hình khi review giao diện. Lỗi biên dịch/runtime vẫn hiện như cũ. */
  devIndicators: false,
  experimental: {
    /**
     * Bao lâu trình duyệt dùng lại trang đã tải/prefetch mà không hỏi server.
     *
     * `static` (trang public — dựng tĩnh, xem `app/[locale]/layout.tsx`): 30
     * phút thay vì 5. Dữ liệu ở đó chỉ đổi khi admin bấm Lưu, và người đang
     * lướt site thấy bản cũ vài phút là vô hại; đổi lại mọi lần quay lại trang
     * đã xem là tức thì, kể cả trên 3G.
     *
     * `dynamic` (thiep-cua-toi…): 30 giây thay vì 0 — quay lại màn vừa
     * xem không phải đợi một vòng tới server. Không lâu hơn: đây là dữ liệu
     * người dùng tự sửa, và mutation nào cũng phải thấy kết quả ngay.
     */
    staleTimes: {
      dynamic: 30,
      static: 1800,
    },
  },
  images: {
    // Mặc định Next chỉ xuất WebP, tức ảnh nguồn đã là AVIF (ảnh mẫu thiệp,
    // ảnh khách tải lên) bị giải nén rồi nén lại thành tệp **to hơn**. Trình
    // duyệt không nhận AVIF vẫn được WebP qua header `Accept`.
    formats: ["image/avif", "image/webp"],
    // Hero là ảnh full-viewport và thường được xem trên màn hình Retina; mức
    // 90 giữ vi chi tiết khuôn mặt/tóc sau bước tối ưu động của `next/image`.
    qualities: [70, 75, 90],
    imageSizes: OPENING_IMAGE_SIZES,
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/images/shared/opening/**", search: "?v=20260909-2" },
    ],
    remotePatterns: [
      // Avatar tài khoản đăng nhập bằng Google.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Avatar tài khoản đăng nhập bằng Facebook. Graph API trả link ảnh ở
      // host này (không phải graph.facebook.com), kèm chữ ký hết hạn theo
      // thời gian, nên link chết sau một thời gian là chuyện bình thường.
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      // Ảnh QR VietQR của SePay trên màn thanh toán. Nhúng ở dạng
      // `unoptimized`: mỗi đơn là một URL khác nhau nên bộ tối ưu của Next
      // không tái dùng được gì, mà lại chen thêm một chặng vào đúng đường
      // thanh toán.
      { protocol: "https", hostname: "qr.sepay.vn" },
    ],
  },
};

export default nextConfig;
