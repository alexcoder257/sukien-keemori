/**
 * Bỏ khoá của tính năng đã gỡ khỏi nội dung đọc từ thiệp cũ.
 *
 * Diamond Song Hỷ (thiệp riêng nhà trai / nhà gái) đã bị gỡ: thiệp lưu trước
 * đó vẫn có thể mang `familySplit` trong `content`, còn `viewSide` chỉ là thứ
 * để trình bày. Không nơi nào đọc chúng nữa; bỏ ở ranh giới để chúng không lọt
 * vào state của editor rồi bị gửi ngược lên backend.
 */
export function stripLegacyKeys<T extends object>(content: T): T {
  const clean = { ...content } as Record<string, unknown>;
  delete clean.familySplit;
  delete clean.viewSide;
  return clean as T;
}
