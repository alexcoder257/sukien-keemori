/**
 * Đánh giá mẫu thiệp. Bản chính thức của các giới hạn này nằm ở
 * `backend/src/common/constants/review.constants.ts`; bản sao ở đây chỉ để form
 * phản hồi ngay, không thay backend kiểm tra.
 */
export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;

/** Nhận xét là tuỳ chọn — chấm sao rồi gửi luôn cũng là một đánh giá hợp lệ. */
export const REVIEW_MAX_COMMENT_LENGTH = 500;

/** Thang sao để render, `[1, 2, 3, 4, 5]`. */
export const RATING_SCALE = Array.from(
  { length: REVIEW_MAX_RATING },
  (_, index) => index + 1,
);
