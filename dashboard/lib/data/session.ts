import "server-only";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/apis/config";
import { decodeJwt, isJwtExpired } from "@/apis/jwt";
import {
  isAdminPermission,
  isAdminRole,
  type AdminSession,
} from "@/constants/permission";

/**
 * Còn phiên hợp lệ nếu access token chưa hết hạn, hoặc còn refresh token hợp lệ.
 * Chỉ dùng để chọn giao diện — quyền truy cập thật do backend và `proxy.ts`
 * quyết định.
 */
export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  const access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (access && !isJwtExpired(access)) return true;
  const refresh = store.get(REFRESH_TOKEN_COOKIE)?.value;
  return !!refresh && !isJwtExpired(refresh);
}

/**
 * Email, vai trò và quyền đọc từ access token CMS; `null` nếu không có phiên.
 *
 * Chữ ký **không** được verify ở đây — giá trị này chỉ để chọn giao diện (ẩn
 * mục nav, ẩn nút). Mọi route quản trị đều có guard quyền ở backend, và đó mới
 * là chỗ quyết định.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!access || isJwtExpired(access)) return null;
  const claims = decodeJwt(access);
  if (!claims) return null;

  return {
    email: claims.email ?? "",
    role: isAdminRole(claims.role) ? claims.role : null,
    permissions: (claims.permissions ?? []).filter(isAdminPermission),
  };
}
