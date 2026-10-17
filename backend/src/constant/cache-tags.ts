/**
 * Từ vựng tag cache mà backend bắn sang frontend qua `RevalidateService.ping`.
 *
 * **Bản sao có chủ đích** của `frontend/constants/cache-tags.ts` — cùng loại
 * với `apis/http.ts` và `constants/role.ts` (xem `CLAUDE.md`). Sai một ký tự ở
 * một bên thì không có lỗi nào nổi lên: cache chỉ đơn giản không bao giờ được
 * xoá, và biên tập viên sẽ báo "sửa xong không thấy đổi".
 */
export const CACHE_TAGS = {
  siteSettings: 'site-settings',
  templates: 'templates',
  faq: 'faq',
  siteStats: 'site-stats',
  showcase: 'showcase',
  pricing: 'pricing',
} as const;

/**
 * Lời chúc đã duyệt của **một** tấm thiệp. Tag theo từng thiệp chứ không phải
 * một tag chung: ngày cưới có thể vào vài chục lời chúc trong ít phút, và một
 * tag chung ở đó nghĩa là mọi thiệp đang được xem đều mất cache theo.
 */
export function cardWishesTag(slug: string): string {
  return `card-wishes:${slug}`;
}
