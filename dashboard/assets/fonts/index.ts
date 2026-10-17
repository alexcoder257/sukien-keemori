/**
 * Kho font của CMS.
 *
 * Trang khách có cả một kệ font vì mỗi mẫu thiệp là một art direction riêng.
 * Khu quản trị thì không: mọi màn làm việc chỉ dùng Inter, phân cấp tiêu đề tạo
 * bằng cỡ chữ, độ đậm và tracking.
 *
 * Ngoại lệ duy nhất là Playfair Display cho **trang đăng nhập** — cửa vào mang
 * diện mạo thương hiệu Keemori. Nó chỉ được import ở đó nên các màn khác không
 * tải thêm byte nào. Đừng dùng nó cho màn làm việc.
 */
export { inter } from "./inter";
export { playfairDisplay } from "./playfair-display";
