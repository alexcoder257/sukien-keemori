import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/apis/config";
import { isJwtExpired } from "@/apis/jwt";
import { PATHNAME_HEADER } from "@/constants/http";
import {
  clearTokenCookies,
  refreshTokens,
  writeTokenCookies,
  type TokenSet,
} from "@/lib/admin-auth";

/**
 * Cả app này là khu quản trị, nên **mọi** route đều yêu cầu đăng nhập — chỉ trừ
 * chính trang đăng nhập. Đó là khác biệt so với `proxy.ts` của trang khách,
 * nơi phải liệt kê từng segment cần gác.
 *
 * Ở đây chỉ gác *đã đăng nhập hay chưa*, không gác quyền: token đọc ở edge
 * không được verify chữ ký. Quyền theo từng màn do backend quyết định bằng
 * `@Permissions(...)` ở từng route, và đó mới là hàng rào thật.
 */
const LOGIN_SEGMENT = "dang-nhap";

interface Session {
  authed: boolean;
  /** Bộ token vừa xin được — phải ghi lại vào cookie của response. */
  rotated?: TokenSet;
  /** Backend nói phiên đã chết; xoá cookie để client thôi thử lại. */
  revoked?: boolean;
}

/**
 * Còn phiên hay không, và **làm mới ngay tại đây** nếu access token đã hết hạn.
 *
 * Server Component (`lib/data/api.ts`) chạy trong chính request này và gắn
 * access token từ cookie; để token hết hạn đi tiếp thì trang đổ 401 trước khi
 * trình duyệt kịp chạy dòng JavaScript nào. Proxy là nơi duy nhất vừa đọc được
 * refresh token (`httpOnly`) vừa ghi được cookie mới, nên việc làm mới thuộc
 * về nó. Client gặp 401 giữa chừng thì đi qua `/api/auth/refresh`.
 */
async function resolveSession(request: NextRequest): Promise<Session> {
  const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (access && !isJwtExpired(access)) return { authed: true };

  const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refresh || isJwtExpired(refresh)) return { authed: false };

  try {
    const rotated = await refreshTokens(request, refresh);
    // Backend từ chối: phiên đã hết hoặc bị thu hồi, giữ lại chỉ tổ lặp.
    if (!rotated) return { authed: false, revoked: true };
    return { authed: true, rotated };
  } catch {
    // Backend không với tới được (mạng, deploy). Đây không phải bằng chứng
    // phiên đã hỏng, nên không xoá cookie — chỉ coi như chưa đăng nhập lượt này.
    return { authed: false };
  }
}

/**
 * Kết quả của `resolveSession` phải ghi vào **cả hai chiều**, và theo đúng thứ
 * tự: request trước (để Server Component render trong chính lượt này thấy token
 * còn hạn), response sau (để trình duyệt giữ tiếp).
 */
function writeSessionToRequest(request: NextRequest, session: Session): void {
  if (session.rotated) {
    request.cookies.set(ACCESS_TOKEN_COOKIE, session.rotated.accessToken);
    request.cookies.set(REFRESH_TOKEN_COOKIE, session.rotated.refreshToken);
  } else if (session.revoked) {
    request.cookies.delete(ACCESS_TOKEN_COOKIE);
    request.cookies.delete(REFRESH_TOKEN_COOKIE);
  }
}

function writeSessionToResponse(
  response: NextResponse,
  session: Session,
): NextResponse {
  if (session.rotated) writeTokenCookies(response, session.rotated);
  else if (session.revoked) clearTokenCookies(response);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Đảm bảo có prefix locale.
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (!hasLocale) {
    request.nextUrl.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  const [, locale, segment] = pathname.split("/"); // ["", "vi", "nguoi-dung", ...]
  const session = await resolveSession(request);
  writeSessionToRequest(request, session);

  if (segment === LOGIN_SEGMENT) {
    if (!session.authed) {
      return writeSessionToResponse(
        NextResponse.next({ request: { headers: forwardedHeaders(request) } }),
        session,
      );
    }
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = `/${locale}`;
    homeUrl.search = "";
    return writeSessionToResponse(NextResponse.redirect(homeUrl), session);
  }

  if (!session.authed) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/${LOGIN_SEGMENT}`;
    loginUrl.searchParams.set("next", pathname);
    return writeSessionToResponse(NextResponse.redirect(loginUrl), session);
  }

  return writeSessionToResponse(
    NextResponse.next({ request: { headers: forwardedHeaders(request) } }),
    session,
  );
}

/**
 * Header chuyển tiếp xuống lượt render này.
 *
 * Luôn mang `x-pathname` vì `not-found.tsx` **không nhận `params`** — không có
 * header này thì trang 404 không biết mình đang ở `/vi` hay `/en`.
 *
 * Dựng từ `request.headers` **sau** `writeSessionToRequest` nên cặp token vừa
 * xoay (nằm trong header `cookie`) vẫn đi cùng.
 */
function forwardedHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);
  return headers;
}

export const config = {
  // Bỏ qua Next internals, file tĩnh (có phần mở rộng) và `/api` — route
  // handler đăng nhập phải chạy được khi *chưa* có phiên.
  matcher: ["/((?!_next|api/|.*\\..*).*)"],
};
