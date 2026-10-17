// Đọc access token CMS từ cookie để gắn `Authorization` khi gọi backend.
// Refresh token là cookie `httpOnly` — JavaScript không đọc được, việc làm mới
// đi qua `/api/auth/refresh` (xem `lib/admin-auth.ts`).
"use client";

import { ACCESS_TOKEN_COOKIE } from "./config";
import { isJwtExpired } from "./jwt";

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

export function clearAccessToken() {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasValidAccessToken(): boolean {
  const token = getAccessToken();
  return !!token && !isJwtExpired(token);
}
