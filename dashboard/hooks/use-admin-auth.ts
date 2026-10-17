"use client";

import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/apis/admin-auth";

/**
 * Không có cache nào để cập nhật: đổi mật khẩu thu hồi phiên, và form đăng
 * xuất ngay sau đó bằng điều hướng toàn trang — cache React Query mất theo.
 */
export function useChangePasswordMutation() {
  return useMutation({ mutationFn: changePassword });
}
