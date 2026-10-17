export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Tên cookie lưu token CMS. Access token non-httpOnly để client đọc gắn
// Authorization header; refresh token là httpOnly và chỉ server đọc — xem
// `lib/admin-auth.ts`.
//
// Prefix `admin_` để không trùng tên với cookie của `frontend/apis/config.ts`:
// cookie không phân biệt theo port, chỉ theo host — hai app cùng chạy trên
// `localhost` (khác port) nên tên cookie trùng nhau sẽ bị ghi đè qua lại giữa
// phiên đăng nhập CMS và phiên đăng nhập trang khách trên cùng một trình duyệt.
export const ACCESS_TOKEN_COOKIE = "admin_access_token";
export const REFRESH_TOKEN_COOKIE = "admin_refresh_token";
