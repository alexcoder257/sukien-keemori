/**
 * Băm mật khẩu bằng SHA-256 (Web Crypto) trước khi gửi lên backend — bản sao
 * có chủ đích của `frontend/apis/crypto.ts`.
 *
 * Không thay thế HTTPS: giá trị hash này thành "bí mật" thực sự gửi qua mạng.
 * Backend nhận hash rồi bcrypt lần nữa mới lưu.
 */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
