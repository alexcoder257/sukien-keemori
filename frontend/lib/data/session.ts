import "server-only";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/apis/config";
import { decodeJwt, isJwtExpired } from "@/apis/jwt";
import { isUserRole, type UserRole } from "@/constants/role";

/**
 * Còn phiên hợp lệ nếu access token chưa hết hạn, hoặc còn refresh token hợp lệ
 * (client sẽ tự refresh ở lần gọi API kế tiếp). Chỉ dùng để chọn giao diện —
 * quyền truy cập thật do backend và `proxy.ts` quyết định.
 */
export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  const access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (access && !isJwtExpired(access)) return true;
  const refresh = store.get(REFRESH_TOKEN_COOKIE)?.value;
  return !!refresh && !isJwtExpired(refresh);
}

/**
 * Quyền đọc từ access token, `null` nếu không có phiên hoặc token khó hiểu.
 *
 * Chữ ký **không** được verify ở đây — cũng như `hasSession`, giá trị này chỉ
 * để chọn giao diện (ẩn mục nav dành riêng cho `super_admin`). Mọi route quản
 * trị đều có guard quyền ở backend, và đó mới là chỗ quyết định.
 */
export async function getSessionRole(): Promise<UserRole | null> {
  const store = await cookies();
  const access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!access || isJwtExpired(access)) return null;
  const role = decodeJwt(access)?.role;
  return isUserRole(role) ? role : null;
}
