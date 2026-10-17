"use client";

import { request } from "./http";

/**
 * Một đánh giá mẫu thiệp như khu quản trị nhìn thấy.
 *
 * Khác bản công khai ở hai chỗ: có `templateSlug` (bảng này gộp mọi mẫu) và có
 * email người viết — admin phải định danh được tài khoản đứng sau một nhận xét
 * trước khi gỡ nó.
 */
export interface AdminTemplateReview {
  id: string;
  templateSlug: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; email: string; fullName: string };
}

export interface AdminTemplateReviewList {
  items: AdminTemplateReview[];
  total: number;
}

export interface QueryTemplateReviewsInput {
  templateSlug?: string;
  q?: string;
  rating?: number;
  limit?: number;
  offset?: number;
}

export function getAdminTemplateReviews(
  input: QueryTemplateReviewsInput = {},
): Promise<AdminTemplateReviewList> {
  const params = new URLSearchParams();
  if (input.templateSlug) params.set("templateSlug", input.templateSlug);
  if (input.q) params.set("q", input.q);
  if (input.rating) params.set("rating", String(input.rating));
  if (input.limit !== undefined) params.set("limit", String(input.limit));
  if (input.offset !== undefined) params.set("offset", String(input.offset));
  const query = params.toString();
  return request<AdminTemplateReviewList>(
    `/admin/template-reviews${query ? `?${query}` : ""}`,
  );
}

/** Gỡ hẳn một đánh giá. Người viết vẫn có thể gửi lại bản mới cho mẫu đó. */
export function deleteAdminTemplateReview(id: string): Promise<void> {
  return request<void>(`/admin/template-reviews/${id}`, { method: "DELETE" });
}
