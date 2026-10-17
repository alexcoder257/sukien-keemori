"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogs, type AuditLogFilters } from "@/apis/audit";

export const auditQueryKeys = {
  all: ["audit-logs"] as const,
  page: (filters: AuditLogFilters) =>
    [...auditQueryKeys.all, filters] as const,
};

/**
 * Một trang nhật ký.
 *
 * `placeholderData` giữ lại trang cũ trong lúc trang mới đang tải: bảng này
 * được lật trang và đổi bộ lọc liên tục lúc tra soát, mà nhấp nháy về trạng
 * thái rỗng giữa hai lần tải làm mất chỗ mắt đang nhìn.
 *
 * Không có `refetchInterval`: nhật ký là thứ tra khi có sự cố, không phải bảng
 * theo dõi thời gian thực — cùng lý do `notifications` cố ý không polling.
 */
export function useAuditLogsQuery(filters: AuditLogFilters) {
  return useQuery({
    queryKey: auditQueryKeys.page(filters),
    queryFn: () => getAuditLogs(filters),
    placeholderData: (previous) => previous,
  });
}
