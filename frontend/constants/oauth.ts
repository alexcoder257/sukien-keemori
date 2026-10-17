/**
 * Nhà cung cấp đăng nhập ngoài. Giá trị phải khớp backend
 * (`common/enums/oauth-provider.enum.ts`): nó vừa là đoạn route
 * `/auth/{provider}`, vừa là đường dẫn trang trung chuyển
 * `/{locale}/oauth/{provider}`.
 */
export const OAUTH_PROVIDERS = ["google", "facebook"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/** Tên hiển thị — dùng để điền vào chuỗi dịch có chỗ trống `{provider}`. */
export const OAUTH_PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: "Google",
  facebook: "Facebook",
};

/**
 * Nhà cung cấp có nút trên form đăng nhập/đăng ký. Tách khỏi `OAUTH_PROVIDERS`
 * vì tắt nút không được làm chết trang trung chuyển `/oauth/facebook` hay thông
 * báo lỗi `?provider=facebook` của người đang dở luồng.
 *
 * Facebook tạm ẩn: app Meta đang ở chế độ Development (nút Đăng bị khoá), nên
 * chỉ tài khoản có vai trò trong app đăng nhập được — mọi người khác bị
 * Facebook chặn. Bật lại khi app đã Live; backend vẫn giữ nguyên route.
 */
export const ENABLED_OAUTH_PROVIDERS: readonly OAuthProvider[] = ["google"];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}
