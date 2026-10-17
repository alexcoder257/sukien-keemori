/**
 * Nhà cung cấp đăng nhập ngoài đang hỗ trợ.
 *
 * Giá trị ở đây đi thẳng vào ba chỗ và phải khớp cả ba: đường dẫn route
 * (`/auth/{provider}`), cột khoá nối trong bảng `users` (`{provider}_id`) và
 * trang trung chuyển bên frontend (`/{locale}/oauth/{provider}`).
 */
export const OAUTH_PROVIDERS = ['google', 'facebook'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
