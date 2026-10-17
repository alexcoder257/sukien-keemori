// Giải mã JWT không cần verify chữ ký — chỉ để đọc `exp` phía client/edge.
// KHÔNG dùng để xác thực; việc verify là của backend.

interface JwtClaims {
  exp?: number;
  sub?: string;
  email?: string;
  /**
   * Quyền của tài khoản, do backend nhúng vào token.
   *
   * Chỉ dùng để **chọn giao diện** — ẩn mục nav mà tài khoản này không dùng
   * được. Token đọc ở đây không hề được verify chữ ký, nên nó không bao giờ là
   * căn cứ cho phép làm gì: mọi route quản trị đều có guard quyền ở backend.
   */
  role?: string;
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)) as JwtClaims;
  } catch {
    return null;
  }
}

// Coi là hết hạn nếu không đọc được exp, hoặc exp đã qua (trừ 5s đệm).
export function isJwtExpired(token: string): boolean {
  const claims = decodeJwt(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now() + 5000;
}
