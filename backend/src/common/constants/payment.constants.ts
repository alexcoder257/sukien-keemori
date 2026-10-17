/**
 * Thời gian màn thanh toán **giữ chỗ** cho một đơn, tính từ lúc tạo đơn.
 *
 * Đây là hạn của *màn hình*, không phải hạn của *đơn*: hết giờ thì trang ngừng
 * hỏi lại và nói cho khách biết, còn đơn vẫn ở `pending` và mã vẫn ghép được.
 * Cố ý như vậy — mã đã nằm trong app ngân hàng của khách từ lúc họ quét QR, nên
 * huỷ đơn theo đồng hồ nghĩa là tiền chuyển muộn vài phút sẽ rơi vào một đơn
 * không còn tồn tại: `payments` ghi nhận giao dịch mồ côi và phải có người tra
 * soát ghép tay.
 *
 * Backend là nơi giữ con số này vì mốc hết hạn phải sống sót qua một lần tải
 * lại trang: đếm ngược thuần client thì F5 là quay về đủ 10 phút.
 */
export const PAYMENT_HOLD_MINUTES = 10;

export const PAYMENT_HOLD_MS = PAYMENT_HOLD_MINUTES * 60_000;
