/**
 * Mã lỗi máy đọc được, đi kèm `message` trong body lỗi.
 *
 * `message` là câu tiếng Việt cho người đọc; frontend không được so chuỗi đó để
 * rẽ nhánh — sửa một chữ là nhánh chết không báo lỗi. Chỉ thêm mã khi client
 * thật sự phải **xử lý khác** một lỗi (hiện thông báo riêng, dẫn tới trang
 * khác), không gắn mã cho mọi lỗi.
 *
 * Bản sao phía frontend: `API_ERROR_CODES` trong `frontend/constants/http.ts`.
 */
export const ERROR_CODES = {
  /** Lưu thiệp đổi tên cô dâu chú rể sau mốc khoá 15 ngày. */
  COUPLE_NAMES_LOCKED: 'COUPLE_NAMES_LOCKED',
  /** Xuất bản link thiệp khi thiệp chưa thanh toán: mở hộp thanh toán. */
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  /**
   * Token phiên tải ảnh sai hoặc hết hạn. Editor phải phân biệt với 401 của
   * access token: lỗi này không refresh được, cách xử lý là mở phiên mới rồi
   * gửi lại những ảnh chưa xong.
   */
  UPLOAD_SESSION_INVALID: 'UPLOAD_SESSION_INVALID',
  /**
   * Ảnh tạm còn trong hàng đợi nén nên chưa có bản xem trước. Editor đang khôi
   * phục bản nháp thì đợi rồi hỏi lại, khác hẳn 404 là ảnh đã mất.
   */
  STAGED_PHOTO_PROCESSING: 'STAGED_PHOTO_PROCESSING',
} as const;
