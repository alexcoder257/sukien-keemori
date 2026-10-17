import type { CSSProperties } from "react";

/**
 * Ảnh preview được gộp thành atlas 2×2 (một file, bốn ô) để giảm số request.
 *
 * `object-position` không đủ để cắt đúng một ô: với `object-fit: cover`, khung
 * gần vuông sẽ hiện gần như cả bốn ô. Vì vậy đặt ảnh trong một lớp bọc rộng
 * gấp đôi khung rồi dịch sang ô cần lấy — dịch 100% chiều rộng khung tương
 * đương đúng một cột của atlas. (`next/image` với `fill` không cho phép đổi
 * `width`/`height` của chính thẻ ảnh, nên kích thước nằm ở lớp bọc.)
 *
 * `position` dùng lại đúng chuỗi trong dữ liệu mẫu, ví dụ `"100% 0%"`.
 * Lớp bọc phải là `position: absolute` bên trong khung có `overflow: hidden`.
 */
export function atlasCell(position: string): CSSProperties {
  const [x = "0%", y = "0%"] = position.trim().split(/\s+/);

  return {
    position: "absolute",
    width: "200%",
    height: "200%",
    left: `-${x}`,
    top: `-${y}`,
  };
}
