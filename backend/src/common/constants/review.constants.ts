/**
 * Đánh giá mẫu thiệp — thang điểm và giới hạn độ dài.
 *
 * Bản chính thức nằm ở đây; `frontend/constants/review.ts` giữ một bản sao để
 * form phản hồi ngay mà không cần chờ backend trả lỗi.
 */
export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;

/** Nhận xét là **tuỳ chọn**: chấm sao xong bấm gửi luôn cũng là một đánh giá. */
export const REVIEW_MAX_COMMENT_LENGTH = 500;
