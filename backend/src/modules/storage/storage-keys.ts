/**
 * Khoá của hai provider không giống nhau: đĩa local trả
 * `cards/<id>/photos/<tệp>` còn R2 gắn thêm tiền tố công khai
 * (`uploads/cards/...`). Vì vậy phép kiểm nhận tiền tố bất kỳ nhưng vẫn bắt
 * đúng ba đoạn cuối, và bảng ký tự không có `.` liên tiếp nên không đi ngược
 * được ra khỏi thư mục.
 *
 * Đây là chốt chặn của mọi lệnh xoá ảnh suy từ dữ liệu người dùng gửi lên:
 * `content` là JSON tự do, nên chủ thiệp A dán được URL ảnh của thiệp B vào
 * thiệp mình. Không có phép kiểm này thì lượt lưu kế tiếp — khi A gỡ URL đó ra
 * — sẽ xoá mất ảnh của B.
 */
export function isKeyInsideCard(key: string, cardId: string): boolean {
  const pattern = new RegExp(
    `^(?:[A-Za-z0-9_-]+/)*cards/${cardId}/(?:photos|album)/[A-Za-z0-9][A-Za-z0-9._-]*$`,
  );
  return !key.includes('..') && pattern.test(key);
}
