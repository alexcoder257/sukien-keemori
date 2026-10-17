/**
 * Tách ô "danh sách khách mời" thành từng tên: mỗi dòng một khách, bỏ dòng
 * trống, gộp khoảng trắng thừa.
 *
 * **Không khử trùng lặp.** Hai dòng "Bạn Minh" rất có thể là hai người khác
 * nhau cùng tên — gộp lại là một trong hai người không có link.
 *
 * Bản sao có chủ đích ở `frontend/lib/guest-list.ts`: editor đếm số khách bằng
 * chính phép tách này, lệch một bên là con số trong editor khác số link sinh ra.
 */
export function parseGuestNames(guestList: string): string[] {
  return guestList
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
}
