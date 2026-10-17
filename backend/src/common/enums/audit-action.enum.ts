/**
 * Những việc đáng để lại dấu vết.
 *
 * Danh sách này **cố ý ngắn**. Audit log chỉ có giá trị khi đọc được bằng mắt
 * lúc đang có sự cố; ghi mọi thao tác vào đây thì tra một vụ mất dữ liệu sẽ là
 * lội qua vài nghìn dòng "admin xem danh sách người dùng". Luật chọn: chỉ ghi
 * thứ **không hồi phục được** hoặc **đổi quyền lực của một tài khoản**.
 *
 * Tên dạng `<đối tượng>.<việc>` để lọc theo tiền tố khi danh sách dài ra.
 */
export const AUDIT_ACTIONS = [
  /** Người dùng tự xoá tài khoản — xoá thật, kèm thiệp và ảnh. */
  'user.self_deleted',
  /** Admin vô hiệu hoá tài khoản từ CMS — soft delete, dữ liệu ở nguyên. */
  'user.disabled',
  /** Đổi vai trò. `super_admin` mới làm được, và không tự đổi của mình. */
  'user.role_changed',
  /**
   * Các giá trị `partner.*` và target `partner_store` thuộc tính năng đối tác
   * đã bị gỡ. Giữ lại **chỉ** để đọc các dòng nhật ký cũ; không còn code nào
   * ghi chúng.
   *
   * Duyệt hồ sơ đối tác.
   */
  'partner.approved',
  /** Từ chối hồ sơ đối tác (tính năng đã gỡ, chỉ còn trong nhật ký cũ). */
  'partner.rejected',
  /**
   * Admin nâng thẳng một tài khoản thành đối tác, không qua đơn. Đã gỡ từ
   * trước; giá trị giữ lại cho các dòng nhật ký đã ghi.
   */
  'partner.promoted',
  /**
   * Thu hồi quyền đối tác (tính năng đã gỡ, chỉ còn trong nhật ký cũ).
   */
  'partner.revoked',
  /**
   * Ghép tay một khoản tiền vào đơn. Đi qua đúng `markPaid` như webhook nên nó
   * **nâng gói thật** — đây là thao tác tay có hệ quả tiền bạc lớn nhất trong
   * CMS.
   */
  'order.matched_manually',
  /** Admin xoá một đánh giá mẫu của người dùng. */
  'template_review.deleted',
  /**
   * Admin mở khoá sửa tên cô dâu chú rể trên thiệp đã thanh toán. Ghi vì đây
   * đúng là ngoại lệ của luật chống dùng lại thiệp — mở cho nhầm người là một
   * lần mua thành nhiều đám cưới.
   */
  'card.couple_names_unlocked',
  /** Admin khoá lại tên cô dâu chú rể sau khi đã hỗ trợ đổi xong. */
  'card.couple_names_locked',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Loại đối tượng bị tác động — để lọc và để dựng link về màn tương ứng. */
export const AUDIT_TARGET_TYPES = [
  'user',
  /** Tính năng đối tác đã gỡ; chỉ còn ở dòng nhật ký cũ. */
  'partner_store',
  'order',
  'template_review',
  'card',
] as const;

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];
