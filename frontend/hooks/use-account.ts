"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccountStats } from "@/apis";

export const accountQueryKeys = {
  all: ["account"] as const,
  stats: () => [...accountQueryKeys.all, "stats"] as const,
};

/** Thẻ số liệu Thiệp / Lượt xem / Lời chúc trên trang tài khoản. */
export function useAccountStatsQuery(enabled = true) {
  return useQuery({
    queryKey: accountQueryKeys.stats(),
    queryFn: getAccountStats,
    retry: false,
    enabled,
  });
}
