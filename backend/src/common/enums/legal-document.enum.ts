/**
 * Sáu văn bản pháp lý của nền tảng. Danh sách này là **hợp đồng của ba nơi**:
 * enum Postgres của bảng `legal_acceptances`, `LEGAL_DOCUMENTS` ở
 * `frontend/constants/legal.ts` và các route `/dieu-khoan`, `/chinh-sach-*`.
 * Thêm một văn bản mới thì phải sửa cả ba, kèm migration `ALTER TYPE … ADD VALUE`.
 *
 * Tên khoá dùng snake_case cho khớp giá trị enum lưu xuống DB; frontend gửi lên
 * đúng chuỗi này nên đổi tên khoá là đổi dữ liệu lịch sử.
 */
export const LEGAL_DOCUMENT_TYPES = [
  'terms',
  'privacy',
  'payment_refund',
  /** Điều khoản đối tác — tính năng đã gỡ; giá trị enum giữ lại vì Postgres không xoá được và hàng chấp thuận cũ còn tham chiếu. */
  'partner_terms',
  'complaints',
] as const;
export type LegalDocumentType = (typeof LEGAL_DOCUMENT_TYPES)[number];

/**
 * Hai văn bản **bắt buộc** phải chấp thuận trước khi tài khoản được tạo. Các
 * văn bản còn lại áp dụng theo ngữ cảnh (thanh toán) nên không chặn đăng ký.
 */
export const REQUIRED_SIGNUP_DOCUMENTS = ['terms', 'privacy'] as const;

/**
 * Đường tài khoản đi qua khi chấp thuận. Cần phân biệt vì hai đường có mức
 * bằng chứng khác nhau: `register` là một ô tick người dùng tự bật sau khi
 * hộp văn bản mở ra, còn `oauth` là chấp thuận bằng hành vi ("bấm Tiếp tục với
 * Google nghĩa là bạn đồng ý") — nhà cung cấp OAuth không trả lại ô tick nào.
 * Gộp hai thứ thì sau này không trả lời được câu hỏi của bên pháp chế: người
 * này đã thật sự tick hay chỉ bấm nút?
 *
 * `checkout` là chấp thuận Chính sách thanh toán và hoàn tiền (kèm Chính sách
 * thanh toán) tại đúng lúc đặt mua. Tách riêng vì nó trả lời
 * một câu hỏi khác hẳn hai loại trên: không phải "người này có tài khoản hợp lệ
 * không" mà "lúc trả tiền cho đơn hàng đó, họ đã được cho biết luật hoàn tiền
 * bản nào". Đó là câu bên tra soát sẽ hỏi khi có khiếu nại về một giao dịch cụ
 * thể.
 */
export const LEGAL_ACCEPTANCE_SOURCES = [
  'register',
  'oauth',
  /** Nguồn của đơn đăng ký đối tác (đã gỡ); giữ cho các hàng chấp thuận cũ. */
  'partner_onboarding',
  'reconsent',
  'checkout',
] as const;
export type LegalAcceptanceSource = (typeof LEGAL_ACCEPTANCE_SOURCES)[number];
