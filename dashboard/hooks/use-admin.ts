"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteUser,
  getDashboardOverview,
  getAdminUsers,
  getAdminUserSummary,
  getSiteSettings,
  updateSiteSettings,
  type QueryUsersInput,
  type SiteSettings,
} from "@/apis/admin";

export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
  users: (input: QueryUsersInput) =>
    [...adminQueryKeys.all, "users", input] as const,
  usersRoot: () => [...adminQueryKeys.all, "users"] as const,
  userSummary: (id: string) =>
    [...adminQueryKeys.all, "users", "summary", id] as const,
  settings: () => [...adminQueryKeys.all, "settings"] as const,
};

/* ------------------------------------------------------------- dashboard */

export function useDashboardOverviewQuery() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: getDashboardOverview,
  });
}

/* ------------------------------------------------------------------ users */

export function useAdminUsersQuery(input: QueryUsersInput = {}) {
  return useQuery({
    queryKey: adminQueryKeys.users(input),
    queryFn: () => getAdminUsers(input),
    // Giữ dữ liệu cũ trong lúc gõ ô tìm kiếm: bảng không nháy trắng sau mỗi
    // ký tự, chỉ nội dung thay khi kết quả mới về.
    placeholderData: (previous) => previous,
  });
}

/**
 * Số liệu của một tài khoản. Chỉ chạy khi modal chi tiết mở (`id` khác `null`)
 * — đây là ba câu query gộp, không đáng gọi cho cả bảng chỉ để hiện một hàng.
 */
export function useAdminUserSummaryQuery(id: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.userSummary(id ?? ""),
    queryFn: () => getAdminUserSummary(id as string),
    enabled: id !== null,
  });
}

/**
 * Vô hiệu hoá tài khoản (soft delete); nạp lại bảng người dùng.
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.usersRoot() }),
  });
}

/* --------------------------------------------------------------- settings */

export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.settings(),
    queryFn: getSiteSettings,
  });
}

export function useUpdateSiteSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<SiteSettings>) => updateSiteSettings(input),
    onSuccess: (settings) =>
      queryClient.setQueryData(adminQueryKeys.settings(), settings),
  });
}
