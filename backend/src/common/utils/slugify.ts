/**
 * Chuyển chuỗi tiếng Việt thành đường dẫn: bỏ dấu, thường hoá, nối bằng gạch
 * ngang. Bản đối chiếu của `frontend/lib/slug.ts` — frontend dựng gợi ý ngay
 * trong ô nhập, backend mới là nơi chốt.
 *
 * `đ` phải xử lý riêng: nó không phải `d` cộng dấu phụ nên `normalize('NFD')`
 * không tách ra được, bỏ sót thì "Đức" ra `c` thay vì `duc`.
 */
export function slugify(value: string, maxLength: number): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, maxLength)
      // Cắt theo độ dài có thể để lại gạch ngang ở cuối, mà slug kết thúc bằng
      // gạch ngang thì không khớp `CARD_SLUG_PATTERN`.
      .replace(/-+$/g, '')
  );
}
