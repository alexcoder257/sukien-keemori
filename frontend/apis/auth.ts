"use client";

import type { OAuthProvider } from "@/constants/oauth";
import type { UserRole } from "@/constants/role";
import { API_BASE_URL } from "./config";
import { request } from "./http";
import { hashPassword } from "./crypto";
import { clearTokens, getRefreshToken, setTokens } from "./token";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  emailNotifications: boolean;
  allowShowcase: boolean;
  /** Đã nối tài khoản Google — trang tài khoản hiện cách đăng nhập từ đây. */
  googleLinked: boolean;
  /** Như trên, cho Facebook. Một người có thể nối cả hai. */
  facebookLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string; // mật khẩu thô — sẽ được hash trong hàm này
}

export interface RegisterInput extends LoginInput {
  fullName: string;
  /** Dạng E.164 (`+84912345678`). Vắng mặt là hợp lệ — đây là trường tuỳ chọn. */
  phone?: string;
  /**
   * Các văn bản pháp lý người dùng vừa chấp thuận, kèm **phiên bản họ nhìn
   * thấy trên màn hình**. Backend từ chối đăng ký nếu thiếu Điều khoản sử dụng
   * hoặc Chính sách bảo mật, nên đây không phải trường tuỳ chọn.
   */
  acceptedDocuments: Array<{ type: string; version: string }>;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const password = await hashPassword(input.password);
  const res = await request<AuthResponse>("/auth/register", {
    auth: false,
    method: "POST",
    body: {
      email: input.email,
      fullName: input.fullName,
      password,
      ...(input.phone ? { phone: input.phone } : {}),
      acceptedDocuments: input.acceptedDocuments,
    },
  });
  setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const password = await hashPassword(input.password);
  const res = await request<AuthResponse>("/auth/login", {
    auth: false,
    method: "POST",
    body: { email: input.email, password },
  });
  setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

/**
 * URL điểm vào OAuth. Không phải `request()` vì đây không phải lời gọi API:
 * trình duyệt phải **điều hướng** sang backend rồi sang nhà cung cấp, nên hàm
 * này chỉ dựng URL cho `window.location.href`.
 */
export function oauthUrl(
  provider: OAuthProvider,
  locale: string,
  next?: string,
): string {
  const params = new URLSearchParams({ locale });
  if (next) params.set("next", next);
  return `${API_BASE_URL}/auth/${provider}?${params.toString()}`;
}

/**
 * Kết thúc luồng OAuth: lưu cặp token backend trả về ở fragment rồi lấy hồ sơ.
 * Gọi `getMe()` thay vì tin vào dữ liệu trên URL — hồ sơ luôn đến từ backend.
 */
export async function completeOAuthLogin(
  accessToken: string,
  refreshToken: string,
): Promise<AuthUser> {
  setTokens(accessToken, refreshToken);
  try {
    return await getMe();
  } catch (error) {
    // Token hỏng thì đừng để lại phiên nửa vời trong cookie.
    clearTokens();
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    if (getRefreshToken()) {
      await request<void>("/auth/logout", { method: "POST" });
    }
  } finally {
    clearTokens();
  }
}

/**
 * Yêu cầu gửi link đặt lại mật khẩu. Backend luôn trả 204 dù email có tồn tại
 * hay không (tránh dò email đã đăng ký), nên hàm này không báo "email sai".
 */
export function forgotPassword(
  email: string,
  locale: string,
  captchaToken?: string,
  isResend?: boolean,
): Promise<void> {
  return request<void>("/auth/forgot-password", {
    auth: false,
    method: "POST",
    body: {
      email,
      locale,
      ...(captchaToken ? { captchaToken } : {}),
      ...(isResend ? { isResend } : {}),
    },
  });
}

export async function resetPassword(
  token: string,
  rawPassword: string,
): Promise<void> {
  const password = await hashPassword(rawPassword);
  await request<void>("/auth/reset-password", {
    auth: false,
    method: "POST",
    body: { token, password },
  });
}

export function getMe(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", { method: "GET" });
}

export interface UpdateProfileInput {
  fullName?: string;
  /** Chuỗi rỗng = xoá số điện thoại. */
  phone?: string;
  emailNotifications?: boolean;
  allowShowcase?: boolean;
}

export function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", { method: "PATCH", body: input });
}

/** Tự xoá tài khoản; backend cascade toàn bộ dữ liệu liên quan. */
export async function deleteAccount(): Promise<void> {
  await request<void>("/auth/me", { method: "DELETE" });
  clearTokens();
}
