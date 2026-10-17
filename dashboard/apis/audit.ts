"use client";

import { request } from "./http";

/**
 * Danh sách hành động được ghi. Chép đúng
 * `backend/src/common/enums/audit-action.enum.ts` — **bản sao có chủ đích**
 * như mọi thứ hai app cùng cần, sửa một bên thì sửa nốt bên kia.
 *
 * Có cả route `/admin/audit-logs/actions` trả danh sách này, nhưng ô lọc vẫn
 * dùng hằng số ở đây: nhãn tiếng Việt/tiếng Anh nằm trong từ điển và phải khớp
 * từng khoá, nên một giá trị backend trả về mà từ điển chưa có sẽ hiện ra ô
 * trống. Kiểu `AuditAction` bên dưới bắt lỗi đó ngay lúc build.
 */
export const AUDIT_ACTIONS = [
  "user.self_deleted",
  "user.disabled",
  "user.role_changed",
  "partner.approved",
  "partner.rejected",
  "partner.promoted",
  "partner.revoked",
  "order.matched_manually",
  "template_review.deleted",
  "card.couple_names_unlocked",
  "card.couple_names_locked",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditTargetType =
  | "user"
  | "partner_store"
  | "order"
  | "template_review"
  | "card";

/**
 * Một dòng nhật ký.
 *
 * `actorId`/`targetId` **không** phải khoá ngoại — hàng chúng trỏ tới có thể đã
 * bị xoá (đó thường là chính lý do dòng này tồn tại). Vì vậy luôn hiển thị
 * `actorEmail`/`targetLabel` chứ đừng đi tra ngược tên từ id.
 */
export interface AuditLog {
  id: string;
  action: AuditAction;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  targetType: AuditTargetType;
  targetId: string | null;
  targetLabel: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogFilters {
  action?: AuditAction;
  targetId?: string;
  limit: number;
  offset: number;
}

export function getAuditLogs(filters: AuditLogFilters): Promise<AuditLogPage> {
  const params = new URLSearchParams();
  if (filters.action) params.set("action", filters.action);
  if (filters.targetId) params.set("targetId", filters.targetId);
  params.set("limit", String(filters.limit));
  params.set("offset", String(filters.offset));
  return request<AuditLogPage>(`/admin/audit-logs?${params.toString()}`);
}
