/**
 * Băm mật khẩu bằng SHA-256 (Web Crypto) trước khi gửi lên backend.
 *
 * LƯU Ý BẢO MẬT: đây KHÔNG thay thế cho HTTPS. Băm phía client chỉ để mật khẩu
 * thô không rời khỏi trình duyệt; giá trị hash này trở thành "bí mật" thực sự
 * gửi qua mạng, nên vẫn phải đi qua TLS. Backend nhận hash rồi bcrypt lần nữa
 * mới lưu DB (không lưu trực tiếp giá trị này).
 */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
