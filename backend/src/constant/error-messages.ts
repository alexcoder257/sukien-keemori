/**
 * Tập trung mọi thông báo lỗi ở đây để dễ tái sử dụng & dịch đa ngôn ngữ sau này.
 */
export const ERROR_MESSAGES = {
  TODO: {
    NOT_FOUND: 'Todo không tồn tại',
  },
  AUTH: {
    CAPTCHA_FAILED: 'Xác minh captcha thất bại, vui lòng thử lại',
    EMAIL_EXISTS: 'Email đã được đăng ký',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    INVALID_PASSWORD_FORMAT:
      'Mật khẩu gửi lên phải là chuỗi hash SHA-256 (64 ký tự hex)',
    INVALID_REFRESH_TOKEN: 'Refresh token không hợp lệ hoặc đã hết hạn',
    INVALID_RESET_TOKEN:
      'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
    ACCOUNT_DISABLED: 'Tài khoản này đã bị vô hiệu hóa',
    WRONG_CURRENT_PASSWORD: 'Mật khẩu hiện tại không đúng',
    SAME_PASSWORD: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    // Tài khoản tạo bằng Google/Facebook có `password_hash = NULL`: không có
    // mật khẩu cũ để đối chiếu, nên đường đổi mật khẩu không dùng được — họ
    // phải đi qua "quên mật khẩu" để **đặt** mật khẩu lần đầu.
    NO_PASSWORD_SET:
      'Tài khoản này chưa có mật khẩu; hãy dùng chức năng quên mật khẩu để đặt mật khẩu mới',
    // Dùng chung cho mọi nhà cung cấp OAuth (Google, Facebook): người dùng
    // luôn thấy thông báo có tên nhà cung cấp ở frontend, còn ở đây câu chữ
    // trung tính để không phải nhân đôi mỗi lần thêm một nhà cung cấp.
    OAUTH_FAILED:
      'Đăng nhập bằng tài khoản mạng xã hội thất bại, vui lòng thử lại',
    OAUTH_INVALID_STATE:
      'Phiên đăng nhập không hợp lệ hoặc đã hết hạn, vui lòng thử lại',
    OAUTH_EMAIL_UNVERIFIED:
      'Email của tài khoản này chưa được xác minh nên không thể dùng để đăng nhập',
    OAUTH_EMAIL_MISSING:
      'Tài khoản này không có email nên không thể dùng để đăng nhập',
    OAUTH_NOT_CONFIGURED:
      'Đăng nhập bằng tài khoản mạng xã hội chưa được cấu hình',
    UNAUTHORIZED: 'Bạn cần đăng nhập để tiếp tục',
    USER_NOT_FOUND: 'Người dùng không tồn tại',
  },
  PLACE: {
    NOT_CONFIGURED: 'Tính năng gợi ý địa điểm chưa được cấu hình',
    LOOKUP_FAILED: 'Không lấy được gợi ý địa điểm, vui lòng nhập tay',
    LINK_UNREADABLE:
      'Không đọc được link Google Maps này, vui lòng dán link chia sẻ từ nút Chia sẻ',
    DAILY_LIMIT_REACHED:
      'Bạn đã dùng hết lượt gợi ý địa điểm hôm nay, vui lòng nhập tay',
  },
  CATALOG: {
    TEMPLATE_NOT_FOUND: 'Mẫu thiệp không tồn tại',
    TEMPLATE_SLUG_EXISTS: 'Slug mẫu thiệp đã tồn tại',
  },
  CARD: {
    NOT_FOUND: 'Thiệp không tồn tại',
    NOT_OWNER: 'Bạn không phải chủ của thiệp này',
    SLUG_EXISTS: 'Đường dẫn này đã có người dùng, vui lòng chọn tên khác',
    SLUG_INVALID:
      'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang',
    // `templates.kind` — mẫu sinh nhật không dựng được thiệp cưới và ngược lại.
    TEMPLATE_KIND_MISMATCH: 'Mẫu này không dùng được cho loại thiệp này',
    ALBUM_CAP_EXCEEDED: 'Album vượt quá số ảnh tối đa cho phép',
    // Thiệp phải thanh toán mới có link công khai.
    PAYMENT_REQUIRED: 'Vui lòng thanh toán để tạo link thiệp',
    UNKNOWN_PHOTO_SLOT: 'Ô ảnh không hợp lệ',
    NOT_PUBLISHED: 'Thiệp chưa được xuất bản',
    GUEST_LIST_TOO_LONG: 'Danh sách khách mời vượt quá số người tối đa',
    GUEST_NAME_TOO_LONG: 'Có tên khách mời quá dài',
    // Điều khoản sử dụng mục 3 — `COUPLE_NAMES_LOCK_DAYS`.
    COUPLE_NAMES_LOCKED:
      'Tên cô dâu chú rể đã bị khoá vì thiệp đã xuất bản quá 15 ngày. Vui lòng liên hệ admin để được mở khoá.',
    COUPLE_NAMES_LOCK_NOT_PAID:
      'Chỉ thiệp đã xuất bản mới có khoá tên cô dâu chú rể',
    // Loại thiệp chọn lúc tạo và không đổi được — `content.kind`.
    KIND_IMMUTABLE: 'Không thể đổi loại thiệp sau khi đã tạo',
    // Thiệp không phải thiệp cưới đứng tên bằng `content.occasion.name`.
    OCCASION_NAME_REQUIRED: 'Cần nhập tên trên thiệp',
    COUPLE_NAMES_REQUIRED_TO_PUBLISH:
      'Cần nhập tên cô dâu và chú rể trước khi xuất bản',
    OCCASION_NAME_REQUIRED_TO_PUBLISH:
      'Cần nhập tên trên thiệp trước khi xuất bản',
  },
  REVIEW: {
    NOT_FOUND: 'Bạn chưa đánh giá mẫu thiệp này',
    NOT_FOUND_BY_ID: 'Đánh giá không tồn tại',
    HELPFUL_OWN: 'Không thể đánh dấu hữu ích cho đánh giá của chính bạn',
  },
  WISH: {
    NOT_FOUND: 'Lời chúc không tồn tại',
    BLOCK_DISABLED: 'Thiệp này đang tắt sổ lưu bút',
  },
  RSVP: {
    NOT_FOUND: 'Phản hồi tham dự không tồn tại',
    BLOCK_DISABLED: 'Thiệp này đang tắt xác nhận tham dự',
  },
  NOTIFICATION: {
    NOT_FOUND: 'Thông báo không tồn tại',
  },
  CONTENT: {
    FAQ_NOT_FOUND: 'Câu hỏi không tồn tại',
    SHOWCASE_NOT_FOUND: 'Ô trưng bày không tồn tại',
    SHOWCASE_SLUG_EXISTS: 'Thiệp này đã có trong dải trưng bày',
    SHOWCASE_ORDER_STALE:
      'Danh sách trưng bày vừa thay đổi, tải lại trang rồi sắp xếp lại',
  },
  ORDER: {
    NOT_FOUND: 'Đơn hàng không tồn tại',
    ALREADY_PAID: 'Đơn hàng đã được thanh toán',
    NOT_PAYABLE: 'Đơn hàng không ở trạng thái chờ thanh toán',
    CARD_ALREADY_PAID: 'Thiệp này đã được thanh toán',
    CODE_GENERATION_FAILED:
      'Không tạo được mã thanh toán, vui lòng thử lại sau ít phút',
  },
  VOUCHER: {
    NOT_FOUND: 'Mã giảm giá không tồn tại',
    CODE_EXISTS: 'Mã giảm giá này đã tồn tại',
    PERCENT_TOO_HIGH: 'Mã giảm theo phần trăm không được vượt quá 100%',
    INACTIVE: 'Mã giảm giá này đã ngừng áp dụng',
    NOT_STARTED: 'Mã giảm giá này chưa tới ngày áp dụng',
    EXPIRED: 'Mã giảm giá đã hết hạn',
    BELOW_MIN_AMOUNT: 'Đơn chưa đạt giá trị tối thiểu để dùng mã này',
    USAGE_EXHAUSTED: 'Mã giảm giá đã hết lượt sử dụng',
    USER_LIMIT_REACHED: 'Bạn đã dùng hết lượt của mã giảm giá này',
    /**
     * Câu khách thấy khi nhập mã không có trong bảng. Cố ý một câu chung —
     * nói rõ lý do là xác nhận cho người đoán mã rằng mã đó có thật.
     */
    INVALID: 'Mã giảm giá không hợp lệ',
  },
  PAYMENT: {
    NOT_CONFIGURED: 'Thanh toán chuyển khoản chưa được cấu hình',
    WEBHOOK_NOT_CONFIGURED: 'Webhook thanh toán chưa được cấu hình',
    WEBHOOK_FORBIDDEN: 'Chữ ký webhook không hợp lệ',
    MISSING_CODE: 'Đơn này chưa có mã thanh toán',
    TRANSACTION_NOT_FOUND: 'Giao dịch không tồn tại',
    ALREADY_MATCHED: 'Giao dịch này đã được ghép vào một đơn',
    PENDING_ORDER_NOT_FOUND: 'Không có đơn nào đang chờ thanh toán với mã này',
  },
  PRICING: {
    NOT_CONFIGURED: 'Bảng giá chưa được cấu hình',
  },
  TELEGRAM: {
    WEBHOOK_NOT_CONFIGURED: 'Webhook Telegram chưa được cấu hình',
    WEBHOOK_FORBIDDEN: 'Secret webhook Telegram không hợp lệ',
  },
  RESEND: {
    WEBHOOK_NOT_CONFIGURED: 'Webhook Resend chưa được cấu hình',
    WEBHOOK_FORBIDDEN: 'Chữ ký webhook Resend không hợp lệ',
  },
  STORAGE: {
    FILE_REQUIRED: 'Chưa chọn tệp để tải lên',
    UNSUPPORTED_TYPE: 'Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc AVIF',
    TOO_LARGE: 'Ảnh vượt quá dung lượng cho phép',
    INVALID_IMAGE: 'Tệp không phải ảnh hợp lệ hoặc đã hỏng',
    INVALID_KEY: 'Ảnh này không thuộc thiệp đang sửa',
    SESSION_INVALID:
      'Phiên tải ảnh đã hết hạn, vui lòng tải lại trang và chọn lại ảnh',
    SESSION_FULL: 'Bạn đã tải lên quá nhiều ảnh trong phiên này',
    PHOTO_NOT_FOUND: 'Không tìm thấy ảnh vừa tải lên',
    PHOTO_PROCESSING: 'Ảnh đang được xử lý, vui lòng thử lại sau giây lát',
    DIRECT_UPLOAD_DISABLED: 'Máy chủ không nhận ảnh trực tiếp ở chế độ này',
  },
  LEGAL: {
    CONSENT_REQUIRED:
      'Cần đồng ý Điều khoản sử dụng và Chính sách bảo mật trước khi tạo tài khoản',
  },
} as const;
