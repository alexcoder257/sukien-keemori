/**
 * Từ vựng tag cache dùng chung giữa `lib/data/` (nơi gắn tag vào `fetch`) và
 * backend (nơi bắn `POST /api/revalidate` sau mỗi lần admin lưu).
 *
 * Đây là **bản sao có chủ đích** của `backend/src/constant/cache-tags.ts` —
 * cùng loại với `apis/http.ts` và `constants/role.ts` (xem `CLAUDE.md`). Sai
 * một ký tự ở một bên thì không có lỗi nào nổi lên: cache chỉ đơn giản không
 * bao giờ được xoá, và biên tập viên sẽ báo "sửa xong không thấy đổi".
 *
 * Vì tag là đường xoá **chủ động**, `revalidate` đi kèm không còn là "bao lâu
 * thì nội dung mới hiện ra" nữa — nó tụt xuống thành lưới an toàn cho trường
 * hợp cú ping bị rớt. Nhờ vậy đặt được nhịp dài hẳn (xem `REVALIDATE` trong
 * `lib/data/api.ts`), và đó chính là chỗ giảm tải: một trang marketing gần như
 * không còn chạm database giữa hai lần biên tập.
 */
export const CACHE_TAGS = {
  /** Cấu hình vận hành toàn site (`site_settings`). */
  siteSettings: "site-settings",
  /** Giá của gói duy nhất (`GET /pricing`). */
  pricing: "pricing",
  /** Kho mẫu thiệp: danh sách, mẫu nổi bật, trang chi tiết. */
  templates: "templates",
  /** Câu hỏi thường gặp. */
  faq: "faq",
  /** Số liệu trang chủ (`site_stats`). */
  siteStats: "site-stats",
  /** Thiệp cặp đôi trưng bày ở trang chủ. */
  showcase: "showcase",
} as const;

/**
 * Lời chúc **đã duyệt** của một tấm thiệp.
 *
 * Tag theo từng thiệp chứ không phải một tag chung: duyệt một lời chúc trên
 * thiệp này không được xoá cache lời chúc của mọi thiệp khác. Ngày cưới có thể
 * vào vài chục lời chúc trong ít phút — một tag chung ở đó nghĩa là mọi thiệp
 * đang được xem đều mất cache theo.
 */
export function cardWishesTag(slug: string): string {
  return `card-wishes:${slug}`;
}
