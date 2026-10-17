/**
 * Mã lỗi backend gửi kèm `message` (`ApiError.code`). Bản sao của
 * `backend/src/constant/error-codes.ts`. Rẽ nhánh theo mã, không bao giờ so
 * chuỗi `message` — đó là câu tiếng Việt cho người đọc và đổi được bất cứ lúc
 * nào.
 */
export const API_ERROR_CODES = {
  coupleNamesLocked: "COUPLE_NAMES_LOCKED",
  /** Thiệp chưa thanh toán thì chưa có link công khai (`POST /cards/:id/publish`). */
  paymentRequired: "PAYMENT_REQUIRED",
  uploadSessionInvalid: "UPLOAD_SESSION_INVALID",
  stagedPhotoProcessing: "STAGED_PHOTO_PROCESSING",
} as const;
