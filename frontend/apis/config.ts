export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Tên cookie lưu token. Non-httpOnly để client đọc gắn Authorization header
// và middleware (proxy) đọc để gác route. Xem [[frontend-auth-tokens]].
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Refresh token sống 7 ngày (khớp JWT_REFRESH_EXPIRES ở backend).
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
