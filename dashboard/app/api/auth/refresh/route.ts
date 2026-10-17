import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/apis/config";
import {
  clearTokenCookies,
  refreshTokens,
  writeTokenCookies,
} from "@/lib/admin-auth";

/**
 * Làm mới access token cho **client** (`apis/http.ts` gặp 401). Refresh token
 * là cookie `httpOnly` nên JavaScript không tự gọi backend làm mới được — phải
 * đi qua đây. Điều hướng trang thì `proxy.ts` đã tự làm mới rồi.
 *
 * `POST` để một thẻ `<img src>` ở trang lạ không kích được việc xoay token.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let tokens;
  try {
    tokens = await refreshTokens(request, refreshToken);
  } catch {
    // Backend không với tới được: không xoá cookie, lần sau thử lại.
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (!tokens) {
    const response = NextResponse.json({ ok: false }, { status: 401 });
    clearTokenCookies(response);
    return response;
  }
  const response = NextResponse.json({ ok: true });
  writeTokenCookies(response, tokens);
  return response;
}
