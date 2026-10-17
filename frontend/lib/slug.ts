import { CARD_SLUG_MAX_LENGTH } from "@/constants/invitation";

/**
 * Chuyển một chuỗi tiếng Việt thành đường dẫn: bỏ dấu, thường hoá, nối bằng
 * gạch ngang. Kết quả phải khớp `CARD_SLUG_PATTERN` mà backend kiểm.
 *
 * `đ` phải xử lý riêng: nó không phải `d` + dấu phụ nên `normalize("NFD")`
 * không tách ra được, bỏ sót thì "Đức" ra `c` thay vì `duc`.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, CARD_SLUG_MAX_LENGTH)
    // Cắt theo độ dài có thể để lại một gạch ngang cuối chuỗi, mà slug kết thúc
    // bằng gạch ngang thì không hợp lệ.
    .replace(/-+$/g, "");
}
