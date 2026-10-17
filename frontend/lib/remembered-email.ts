/**
 * "Ghi nhớ tôi" ở form đăng nhập: **chỉ nhớ email**, không bao giờ nhớ mật khẩu.
 *
 * Mật khẩu — kể cả bản đã băm SHA-256 phía client — không được lưu ở đây: chuỗi
 * băm đó chính là thứ `POST /auth/login` nhận, nên ai đọc được nó là đăng nhập
 * được; còn localStorage thì mọi script trên trang đọc được và không bao giờ
 * tự hết hạn. Lưu mật khẩu là việc của trình quản lý mật khẩu của trình duyệt
 * (form khai `autocomplete="current-password"`), nơi nó được mã hoá theo tài
 * khoản hệ điều hành. Email thì không phải bí mật.
 */
const STORAGE_KEY = "remembered_email";

/** Email đã nhớ, hoặc `null`. Storage bị chặn (chế độ riêng tư) thì coi như chưa nhớ. */
export function readRememberedEmail(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function writeRememberedEmail(email: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, email);
  } catch {
    // Hết quota hoặc bị chặn: lần sau chỉ phải gõ lại email, không hỏng gì.
  }
}

export function clearRememberedEmail(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Như trên.
  }
}
