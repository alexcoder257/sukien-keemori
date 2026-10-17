// Regex & rule constants dùng cho validate form (client-side).
// Backend phải enforce lại cùng rule ở API.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Bộ ký tự đặc biệt cho phép (allow-list) — dùng chung cho cả validate lẫn
// thanh độ mạnh, tránh chữ có dấu tiếng Việt bị tính nhầm là ký tự đặc biệt.
export const SPECIAL_RE = /[~`!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|]/;

export const PASSWORD_MIN_LENGTH = 8;
