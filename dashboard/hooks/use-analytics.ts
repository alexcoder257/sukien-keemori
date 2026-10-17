"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalytics, getGoogleAnalytics } from "@/apis/analytics";

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  report: (days: number) =>
    [...analyticsQueryKeys.all, "report", days] as const,
  google: (days: number) =>
    [...analyticsQueryKeys.all, "google", days] as const,
};

export function useAnalyticsQuery(days = 30) {
  return useQuery({
    queryKey: analyticsQueryKeys.report(days),
    queryFn: () => getAnalytics(days),
  });
}

/**
 * Báo cáo Google Analytics.
 *
 * `staleTime` 30 phút khớp cache của backend: GA cập nhật theo giờ, nên hỏi
 * lại mỗi lần đổi tab chỉ tốn một vòng mạng để nhận đúng con số cũ.
 */
export function useGoogleAnalyticsQuery(days = 30) {
  return useQuery({
    queryKey: analyticsQueryKeys.google(days),
    queryFn: () => getGoogleAnalytics(days),
    staleTime: 30 * 60 * 1000,
  });
}
