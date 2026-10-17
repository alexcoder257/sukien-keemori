/**
 * Tham số và hình dạng trả về của các route danh sách có phân trang —
 * **bản sao có chủ đích** của `PaginationDto`/`Paginated` ở
 * `backend/src/common/dto/pagination.dto.ts`, cùng quy ước với `http.ts` và
 * `constants/role.ts` (xem `CLAUDE.md`).
 */

/**
 * `limit` để trống nghĩa là **lấy hết**, không phải một mặc định ngầm: cùng một
 * route vừa phục vụ bảng lật từng trang, vừa phục vụ ô chọn thiệp và form "mẫu
 * trên trang chủ" — hai chỗ sau cần cả kho trong một lượt để chọn và sắp thứ
 * tự.
 */
export type PageInput = { limit?: number; offset?: number };

export type Paged<T> = {
  items: T[];
  /** Tổng số hàng khớp bộ lọc, không phải số hàng trong trang này. */
  total: number;
};

/** Chuỗi query của một `PageInput`; rỗng khi không truyền gì. */
export function pageQuery(page: PageInput): string {
  const params = new URLSearchParams();
  if (page.limit !== undefined) params.set("limit", String(page.limit));
  if (page.offset !== undefined) params.set("offset", String(page.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}
