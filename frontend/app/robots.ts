import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * `/robots.txt`.
 *
 * Danh sách chặn ở đây không phải để giấu dữ liệu — `robots.txt` là văn bản
 * công khai và không chặn được ai. Nó nói với con bò của Google *đừng phí công*
 * vào những đường không có gì để lập chỉ mục, để hạn mức bò dồn vào kho mẫu và
 * Việc chặn thật nằm ở `proxy.ts` và ở backend.
 *
 * Nhóm bị chặn là **khu sau đăng nhập** — không có nội dung công khai nào để
 * index.
 *
 * **Thiệp của khách (`/*​/t/`) cố ý KHÔNG bị Disallow**, dù nó là thứ quan trọng
 * nhất phải giữ khỏi Google. Việc giữ đó nằm ở `noindex` mà từng trang thiệp tự
 * khai — và Google chỉ đọc được `noindex` khi được phép tải trang; Disallow thì
 * một URL có backlink vẫn lọt vào kết quả tìm kiếm dưới dạng một dòng trống.
 *
 * Lý do thứ hai mới là lý do quyết định: bot của Facebook/Messenger **tôn trọng
 * `robots.txt`**, bị chặn là nó không đọc `og:*` và link thiệp chỉ còn hiện chữ
 * "keemori.com". Từng thử giữ Disallow cho `*` rồi mở riêng một nhóm
 * `User-Agent: facebookexternalhit` — đã kiểm ngày 2026-10-08: Meta tải về
 * `robots.txt` mới, server trả 200 cho trang thiệp, vậy mà Sharing Debugger vẫn
 * báo "403 robots.txt block" cho mọi URL `/t/` (trang `/mau-thiep` thì bình
 * thường). Parser của từng bot không theo cùng một chuẩn, nên không chặn gì ở
 * đây là cách duy nhất không phụ thuộc vào nó.
 *
 * `/design-system` và các trang con trả 404 trên production tại `proxy.ts`.
 * Không Disallow nhánh này: Google cần đọc được 404 để loại URL đã biết khỏi
 * chỉ mục; nội dung tham chiếu không được phục vụ.
 *
 * **Trang xác thực** (`/dang-nhap`, `/dang-ky`, `/quen-mat-khau`,
 * `/dat-lai-mat-khau`, `/oauth`) cũng không nằm trong danh sách này, cùng lý do
 * với thiệp: mỗi trang tự khai `noindex`, và Disallow thì con bò không bao giờ
 * thấy thẻ đó. Chúng cũng không có mặt trong sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // `*` ở đầu để phủ cả `/vi/...` lẫn `/en/...`.
        "/*/thiep-cua-toi",
        "/*/tai-khoan",
        "/*/thanh-toan/",
        "/*/editor",
        "/api/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
