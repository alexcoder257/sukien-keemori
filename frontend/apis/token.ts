// Quản lý token phía client qua cookie (để middleware/proxy đọc được).
"use client";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from "./config";
import { isJwtExpired } from "./jwt";

function setCookie(name: string, value: string, maxAgeSeconds?: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const maxAge = maxAgeSeconds ? `; Max-Age=${maxAgeSeconds}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${maxAge}${secure}`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function eraseCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_COOKIE);
}

/**
 * Cookie không có sự kiện "đã đổi", nên hai hàm ghi dưới đây tự phát một event
 * cho `subscribeSession`. Trang public là trang tĩnh — server không biết ai
 * đang xem — nên header đọc phiên ở trình duyệt và phải biết lúc nó đổi.
 */
const SESSION_CHANGE_EVENT = "tco:session-change";

function notifySessionChange() {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function setTokens(accessToken: string, refreshToken: string) {
  // Access token: cookie phiên (hết hạn thực sự do JWT exp kiểm ở proxy/client).
  setCookie(ACCESS_TOKEN_COOKIE, accessToken);
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE);
  notifySessionChange();
}

export function clearTokens() {
  eraseCookie(ACCESS_TOKEN_COOKIE);
  eraseCookie(REFRESH_TOKEN_COOKIE);
  notifySessionChange();
}

/**
 * Gọi `onChange` khi phiên có thể đã đổi: đăng nhập/đăng xuất trong tab này,
 * hoặc người dùng quay lại tab sau khi đăng nhập/đăng xuất ở tab khác (cookie
 * dùng chung giữa các tab nhưng không báo cho nhau).
 */
export function subscribeSession(onChange: () => void): () => void {
  const onVisible = () => {
    if (document.visibilityState === "visible") onChange();
  };
  window.addEventListener(SESSION_CHANGE_EVENT, onChange);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/**
 * Còn phiên đăng nhập hay không — khác `hasValidAccessToken`, vốn chỉ nói access
 * token *còn hạn*.
 *
 * Access token sống ngắn còn người dùng ngồi rất lâu trong một màn hình (editor
 * là ví dụ rõ nhất), nên hỏi nhầm câu là đá một người đang đăng nhập đàng hoàng
 * về trang đăng nhập. Mọi lời gọi API đã tự refresh một lần khi gặp 401, nên
 * câu đúng để hỏi trước khi gọi là câu này.
 */
export function hasSession(): boolean {
  return hasValidAccessToken() || Boolean(getRefreshToken());
}

export function hasValidAccessToken(): boolean {
  const token = getAccessToken();
  return !!token && !isJwtExpired(token);
}
