"use client";

import { hashPassword } from "./crypto";
import { request } from "./http";

/**
 * Tài khoản CMS của chính người đang đăng nhập. Đăng nhập, làm mới và đăng xuất
 * **không** nằm ở đây: chúng đi qua route handler `app/api/auth/*` vì phải
 * đọc/ghi cookie `httpOnly`.
 */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const [currentPassword, newPassword] = await Promise.all([
    hashPassword(input.currentPassword),
    hashPassword(input.newPassword),
  ]);
  return request<void>("/admin/auth/password", {
    method: "PATCH",
    body: { currentPassword, newPassword },
  });
}
