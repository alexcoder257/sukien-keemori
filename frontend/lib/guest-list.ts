/**
 * Tách ô "danh sách khách mời" thành từng tên: mỗi dòng một khách, bỏ dòng
 * trống, gộp khoảng trắng thừa. **Không khử trùng lặp** — hai dòng "Bạn Minh"
 * có thể là hai người khác nhau.
 *
 * Bản sao có chủ đích của `backend/src/modules/cards/guest-list.ts`: số khách
 * editor hiện ra phải đúng bằng số link backend sinh.
 */
export function parseGuestNames(guestList: string): string[] {
  return guestList
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}
