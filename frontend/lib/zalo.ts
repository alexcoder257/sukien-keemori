/**
 * Số Zalo trong `site_settings` là số nội địa 10 chữ số (`0358465162`) —
 * backend đã bỏ dấu cách và kiểm định dạng lúc lưu, nên ở đây chỉ dựng link và
 * nhóm số để đọc.
 */

/** Link mở hội thoại Zalo với số đó, trên điện thoại lẫn Zalo PC/web. */
export function zaloHref(phone: string): string {
  return `https://zalo.me/${phone}`;
}

/**
 * `0358465162` → `0358 465 162`: nhóm 4-3-3 như người Việt đọc số di động.
 * Chuỗi không đúng 10 số thì trả nguyên văn — lớp trình bày không được vỡ vì
 * một giá trị cũ lưu trước khi có luật kiểm.
 */
export function formatZaloPhone(phone: string): string {
  const match = /^(\d{4})(\d{3})(\d{3})$/.exec(phone);
  return match ? match.slice(1).join(" ") : phone;
}
