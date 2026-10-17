"use client";

import type { UserRole } from "@/constants/role";
import type { ShowcaseKind } from "@/constants/showcase";
import type { CardStatus } from "@/constants/template";
import { request } from "./http";

/* ------------------------------------------------------------- dashboard */

export interface DashboardOverview {
  users: number;
  cardsByStatus: Record<CardStatus, number>;
}

/** Số đếm vận hành dùng được cho cả `admin` và `super_admin`. */
export function getDashboardOverview(): Promise<DashboardOverview> {
  return request<DashboardOverview>("/admin/dashboard");
}

/* ------------------------------------------------------------------ users */

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  /**
   * Các trường hồ sơ backend đã trả sẵn trong `GET /admin/users` (response là
   * chính entity `User`, trừ cột `select: false`). Màn chi tiết đọc từ đây nên
   * không cần thêm một route `/admin/users/:id`.
   */
  updatedAt?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  /** Có giá trị nghĩa là tài khoản đăng nhập được bằng Google. */
  googleId?: string | null;
  emailNotifications?: boolean;
  allowShowcase?: boolean;
}

export interface AdminUserList {
  items: AdminUser[];
  total: number;
}

export interface QueryUsersInput {
  role?: UserRole;
  q?: string;
  limit?: number;
  offset?: number;
}

export function getAdminUsers(input: QueryUsersInput = {}): Promise<AdminUserList> {
  const params = new URLSearchParams();
  if (input.role) params.set("role", input.role);
  if (input.q) params.set("q", input.q);
  if (input.limit !== undefined) params.set("limit", String(input.limit));
  if (input.offset !== undefined) params.set("offset", String(input.offset));
  const query = params.toString();
  return request<AdminUserList>(`/admin/users${query ? `?${query}` : ""}`);
}

/**
 * Vô hiệu hoá tài khoản — **soft delete**: backend chỉ đóng dấu `deleted_at`.
 * Dữ liệu (thiệp, đơn hàng) ở nguyên, tài khoản mất đường đăng nhập,
 * và email vẫn giữ chỗ nên không ai đăng ký lại địa chỉ đó được.
 */
export function deleteUser(id: string): Promise<void> {
  return request<void>(`/admin/users/${id}`, { method: "DELETE" });
}

/**
 * Số liệu hoạt động của một tài khoản, cho màn chi tiết.
 */
export interface AdminUserSummary {
  cards: number;
  cardViews: number;
}

export function getAdminUserSummary(id: string): Promise<AdminUserSummary> {
  return request<AdminUserSummary>(`/admin/users/${id}/summary`);
}

/* --------------------------------------------------------------- settings */

export interface SiteSettings {
  /** Số ô mẫu thiệp trên trang chủ; màn "Mẫu trên trang chủ" đọc và ghi giá trị này. */
  homepageTemplateCount: number;
  /** Link Messenger cho nút chat nổi ở trang khách; `null` là chưa cấu hình. */
  messengerUrl: string | null;
  /**
   * Thiệp mà nút "Xem thiệp mẫu" ở hero trang chủ dẫn tới. `null` là chưa cấu
   * hình — trang chủ rơi về thiệp mẫu mặc định trong code.
   */
  demoCardSlug: string | null;
  /** `demoCardSlug` là thiệp (`card`) hay mẫu (`template`). */
  demoCardKind: ShowcaseKind;
  /** Kênh mạng xã hội và email ở chân trang khách; `null` là ẩn biểu tượng đó. */
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  /** Số Zalo nội địa 10 số; `null` là ẩn kênh Zalo. */
  zaloPhone: string | null;
  contactEmail: string | null;
}

export function getSiteSettings(): Promise<SiteSettings> {
  return request<SiteSettings>("/admin/settings");
}

export function updateSiteSettings(
  input: Partial<SiteSettings>,
): Promise<SiteSettings> {
  return request<SiteSettings>("/admin/settings", {
    method: "PATCH",
    body: input,
  });
}
