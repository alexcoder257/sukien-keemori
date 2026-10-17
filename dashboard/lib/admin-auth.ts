import type { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  API_BASE_URL,
  REFRESH_TOKEN_COOKIE,
} from "@/apis/config";

/**
 * Phiên CMS phía **server** của dashboard: route handler `app/api/auth/*` và
 * `proxy.ts` gọi backend (`/admin/auth/*`) rồi ghi cookie.
 *
 * Vì sao đi vòng qua server thay vì trình duyệt gọi thẳng backend: refresh token
 * phải là cookie `httpOnly` của **chính dashboard**, và chỉ code server mới đặt
 * được cookie đó. Không gắn `server-only` vì `proxy.ts` cũng import file này.
 *
 * Hai cookie phiên:
 * - access token **không** `httpOnly`: trình duyệt gọi thẳng backend nên
 *   `apis/http.ts` phải đọc được nó để gắn `Authorization`;
 * - refresh token `httpOnly`: chỉ server cần nó, để JavaScript đọc được là
 *   trao phiên 10 tiếng cho bất kỳ đoạn XSS nào.
 */

/**
 * Địa chỉ backend cho tiến trình server — cùng lý do với `lib/data/api.ts`:
 * trong Docker, `localhost` là chính container dashboard.
 */
const SERVER_API_BASE_URL = process.env.INTERNAL_API_URL || API_BASE_URL;

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  /** Giây — thời gian sống tối đa của phiên, backend quyết định. */
  refreshExpiresIn: number;
}

/**
 * Chuyển tiếp IP của người dùng xuống backend. Backend bật `trust proxy` và
 * throttle đăng nhập theo IP; thiếu header này thì mọi người vận hành chung một
 * IP (container dashboard) và đốt chung một hạn mức 5 lần / 5 phút.
 */
function forwardedHeaders(request: NextRequest): Record<string, string> {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor ? { "X-Forwarded-For": forwardedFor } : {};
}

export type LoginResult =
  | { ok: true; tokens: TokenSet }
  | { ok: false; status: number; message: string | null };

export async function loginWithPassword(
  request: NextRequest,
  body: { email: string; password: string },
): Promise<LoginResult> {
  const response = await fetch(`${SERVER_API_BASE_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...forwardedHeaders(request) },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    const message = Array.isArray(data?.message)
      ? String(data.message[0])
      : typeof data?.message === "string"
        ? data.message
        : null;
    return { ok: false, status: response.status, message };
  }
  return { ok: true, tokens: (await response.json()) as TokenSet };
}

/**
 * `null` nghĩa là backend **từ chối** (phiên đã hết, bị thu hồi, hoặc vừa đổi
 * mật khẩu). Lỗi mạng thì ném ra — nơi gọi phải phân biệt hai trường hợp, vì
 * backend đang deploy không phải bằng chứng phiên đã hỏng.
 */
export async function refreshTokens(
  request: NextRequest,
  refreshToken: string,
): Promise<TokenSet | null> {
  const response = await fetch(`${SERVER_API_BASE_URL}/admin/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...forwardedHeaders(request) },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (response.status === 400 || response.status === 401) return null;
  if (!response.ok) throw new Error(`refresh → ${response.status}`);
  return (await response.json()) as TokenSet;
}

/** Thu hồi refresh token ở backend; lỗi thì bỏ qua — phiên tự hết hạn sau. */
export async function revokeSession(accessToken: string): Promise<void> {
  try {
    await fetch(`${SERVER_API_BASE_URL}/admin/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    // Không chặn đăng xuất vì backend không trả lời.
  }
}

/* --------------------------------------------------------------- cookies */

function secure(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Thuộc tính cookie ở đây phải khớp `apis/token.ts` (cookie access token cùng
 * `Path=/`, `SameSite=Lax`), nếu không sẽ thành hai cookie trùng tên.
 */
export function writeTokenCookies(response: NextResponse, tokens: TokenSet): void {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: tokens.accessToken,
    sameSite: "lax",
    secure: secure(),
    path: "/",
  });
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    sameSite: "lax",
    secure: secure(),
    path: "/",
    ...(tokens.refreshExpiresIn > 0 ? { maxAge: tokens.refreshExpiresIn } : {}),
  });
}

export function clearTokenCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}

/* ------------------------------------------------------------ đường dẫn */

/**
 * URL tuyệt đối trên dashboard cho mọi `NextResponse.redirect` trong route
 * handler. Sau Nginx thì `request.nextUrl` là `http://localhost:3002`, không
 * phải tên miền thật — nên production phải khai `DASHBOARD_URL`.
 */
export function dashboardUrl(request: NextRequest, path: string): URL {
  return new URL(path, process.env.DASHBOARD_URL || request.nextUrl.origin);
}

/**
 * `next` chỉ được là đường dẫn nội bộ: giá trị đến từ query string, nên một
 * URL tuyệt đối (hay `//host`) ở đây là redirect mở sang trang lạ.
 */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
