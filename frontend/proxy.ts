import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";
import {
  ACCESS_TOKEN_COOKIE,
  API_BASE_URL,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/apis/config";
import { isJwtExpired } from "@/apis/jwt";
import { SITE_URL } from "@/lib/seo";
import {
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  VISITOR_HEADER,
} from "@/constants/invitation";

// Route (sau prefix locale) yêu cầu đăng nhập.
// Khu quản trị không nằm trong app này nữa — nó là repo `dashboard/` riêng và
// tự gác phiên bằng `proxy.ts` của chính nó.
//
// `tao-thiep` (bước chọn loại thiệp) cố ý **không** nằm ở đây: đó là trang tĩnh
// công khai, khách chỉ phải đăng nhập lúc bấm Lưu trong editor.
const PROTECTED_SEGMENTS = ["thiep-cua-toi", "tai-khoan", "thanh-toan"];
/**
 * Tên miền chính (không `www.`), lấy từ `NEXT_PUBLIC_SITE_URL`. Bản `www.` vẫn
 * trỏ về cùng server, và trước đây nó trả 200 với cùng nội dung — canonical có
 * cứu được phần nào, nhưng backlink trỏ vào `www.` thì vẫn chia đôi tín hiệu.
 */
const CANONICAL_HOST = new URL(SITE_URL).host;

// Thiệp công khai `/{locale}/t/<slug>` — nơi duy nhất cần mã người xem.
const INVITATION_SEGMENT = "t";

/**
 * Bot lấy ảnh preview khi dán link vào chat/mạng xã hội. Danh sách này chỉ cần
 * đủ để không đốt suất khách của cặp đôi; bot lạ lọt lưới thì cùng lắm là mất
 * một suất, nên không đáng đánh đổi bằng một phép dò phức tạp.
 */
const PREVIEW_BOT_PATTERN =
  /bot|crawler|spider|facebookexternalhit|zalo|telegram|whatsapp|slackbot|discord|linkedin|skype|viber|embedly|preview/i;

// Trang auth — user đã đăng nhập thì đẩy khỏi đây.
const AUTH_SEGMENTS = [
  "dang-nhap",
  "dang-ky",
  "quen-mat-khau",
  "dat-lai-mat-khau",
];

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface Session {
  authed: boolean;
  /** Cặp token vừa xin được — phải ghi lại vào cookie của response. */
  rotated?: Tokens;
  /** Backend nói refresh token đã chết; xoá cookie để client thôi thử lại. */
  revoked?: boolean;
}

/**
 * Còn phiên hay không, và **làm mới ngay tại đây** nếu access token đã hết hạn.
 *
 * Trước đây chỗ này chỉ nhìn cookie rồi cho qua với lý do "client sẽ tự refresh
 * ở lần gọi API kế tiếp". Điều đó đúng với dữ liệu do Client Component tải, nhưng
 * sai với Server Component: `lib/data/api.ts` chạy trong chính request này, gắn
 * đúng cái access token đã hết hạn, và trang đổ 401 trước khi trình duyệt kịp
 * chạy dòng JavaScript nào (`/thiep-cua-toi` là ca điển hình). Proxy là nơi duy
 * nhất vừa đọc được refresh token vừa ghi được cookie mới, nên việc làm mới
 * thuộc về nó.
 */
async function resolveSession(request: NextRequest): Promise<Session> {
  const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (access && !isJwtExpired(access)) return { authed: true };

  const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refresh || isJwtExpired(refresh)) return { authed: false };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    // Backend từ chối: token đã bị xoay hoặc thu hồi, giữ lại chỉ tổ lặp.
    if (!response.ok) return { authed: false, revoked: true };
    const rotated = (await response.json()) as Tokens;
    return { authed: true, rotated };
  } catch {
    // Backend không với tới được (mạng, deploy). Đây không phải bằng chứng phiên
    // đã hỏng, nên không xoá cookie — chỉ coi như chưa đăng nhập cho lượt này.
    return { authed: false };
  }
}

/**
 * Kết quả của `resolveSession` phải ghi vào **cả hai chiều**, và theo đúng thứ
 * tự: request trước (để Server Component render trong chính lượt này thấy token
 * còn hạn — request phải được sửa xong *trước khi* dựng response), response sau
 * (để trình duyệt giữ tiếp).
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

/**
 * Cookie cố ý không `httpOnly` — `apis/token.ts` đọc chúng bằng JavaScript để
 * gắn `Authorization`. Thuộc tính ở đây phải khớp với `setTokens` bên đó, nếu
 * không sẽ thành hai cookie trùng tên khác `Path`.
 */
function writeSessionToResponse(
  response: NextResponse,
  session: Session,
): NextResponse {
  if (session.rotated) {
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE,
      value: session.rotated.accessToken,
      sameSite: "lax",
      secure,
      path: "/",
    });
    response.cookies.set({
      name: REFRESH_TOKEN_COOKIE,
      value: session.rotated.refreshToken,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  } else if (session.revoked) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0) `www.` → tên miền chính, 308 vì đây là chuyển hướng vĩnh viễn (cùng lý
  // do với bước 1 bên dưới). Đọc header `Host` chứ không đọc `nextUrl`: sau
  // reverse proxy, `nextUrl` có thể mang địa chỉ nội bộ của container.
  if (request.headers.get("host") === `www.${CANONICAL_HOST}`) {
    return NextResponse.redirect(
      new URL(`${pathname}${request.nextUrl.search}`, SITE_URL),
      308,
    );
  }

  // Trang tham chiếu chỉ mở trong dev. Trả 404 trước khi render để không
  // phục vụ nội dung nội bộ trên production, kể cả request RSC/prefetch.
  if (
    process.env.NODE_ENV !== "development" &&
    /^\/(?:[^/]+\/)?design-system(?:\/|$)/.test(pathname)
  ) {
    return new NextResponse(null, {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  // 1) Đảm bảo có prefix locale.
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (!hasLocale) {
    // Tiếng Việt là trải nghiệm mặc định cố định. Không tự chọn theo
    // `Accept-Language`: bản tiếng Anh chỉ mở khi URL ghi rõ `/en`.
    request.nextUrl.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    /**
     * **308 chứ không phải 307** (mặc định của `NextResponse.redirect`). Cả hai
     * đều giữ nguyên method, nên khác biệt nằm ở phía Google: 307 là "tạm
     * thời", tức tín hiệu xếp hạng ở lại `/` và `/vi` không được cộng dồn.
     * Chuyển hướng này thì vĩnh viễn — tiếng Việt là mặc định cố định, không
     * đoán theo `Accept-Language` — nên nói đúng như vậy.
     *
     * Trình duyệt cache 308 lâu, và đó là cái giá: đổi lược đồ prefix locale
     * sau này thì khách cũ còn giữ chuyển hướng cũ một thời gian.
     */
    return NextResponse.redirect(request.nextUrl, 308);
  }

  // 2) Gác route theo trạng thái đăng nhập (làm mới access token nếu cần).
  const [, locale, segment] = pathname.split("/"); // ["", "vi", "thiep-cua-toi", ...]
  const session = await resolveSession(request);
  writeSessionToRequest(request, session);

  if (PROTECTED_SEGMENTS.includes(segment) && !session.authed) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/dang-nhap`;
    loginUrl.searchParams.set("next", pathname);
    return writeSessionToResponse(NextResponse.redirect(loginUrl), session);
  }

  if (AUTH_SEGMENTS.includes(segment) && session.authed) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = `/${locale}`;
    homeUrl.search = "";
    return writeSessionToResponse(NextResponse.redirect(homeUrl), session);
  }

  // 3) Nhận diện người xem thiệp, cho trần 15 khách của link chưa thanh toán.
  if (segment === INVITATION_SEGMENT) {
    return writeSessionToResponse(withVisitorId(request), session);
  }

  return writeSessionToResponse(
    NextResponse.next({ request: { headers: forwardedHeaders(request) } }),
    session,
  );
}

/**
 * Header chuyển tiếp xuống lượt render này.
 *
 * Dựng từ `request.headers` **sau** `writeSessionToRequest` nên cặp token vừa
 * xoay (nằm trong header `cookie`) vẫn đi cùng — giống hệt cách `withVisitorId`
 * đang làm.
 *
 * Từng gắn thêm `x-pathname` cho `not-found.tsx`. Đã gỡ: trang 404 đọc header
 * là kéo mọi trang tĩnh về động (xem `i18n/request-locale.ts`).
 */
function forwardedHeaders(request: NextRequest): Headers {
  return new Headers(request.headers);
}

/**
 * Gắn mã người xem cho một lượt vào `/{locale}/t/<slug>`.
 *
 * Chỉ đặt cookie ở **đúng route thiệp**, không đặt trên toàn site: đây là thứ
 * duy nhất cần nó, và một cookie theo dấu người dùng rải khắp trang bán hàng là
 * thứ phải đi hỏi ý kiến người dùng trước.
 *
 * Bot lấy ảnh preview thì không phát mã. Chúng không giữ cookie nên mỗi lần dán
 * link vào một nhóm chat lại là một "khách" mới — chỉ cần vài lần chia sẻ là hết
 * suất trước khi có người thật nào bấm vào. Không có mã thì backend không tính,
 * và thiệp vẫn hiện ra bình thường để cái preview vẫn đẹp.
 */
function withVisitorId(request: NextRequest): NextResponse {
  if (PREVIEW_BOT_PATTERN.test(request.headers.get("user-agent") ?? "")) {
    return NextResponse.next({ request: { headers: forwardedHeaders(request) } });
  }

  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existing ?? crypto.randomUUID();

  // Chuyển tiếp qua header thay vì để trang tự đọc cookie: lần đầu vào thì
  // cookie mới chỉ nằm ở response, trang render trong chính request này sẽ
  // không thấy nó — và đó đúng là lượt xem đầu tiên, lượt quan trọng nhất.
  const headers = forwardedHeaders(request);
  headers.set(VISITOR_HEADER, visitorId);
  const response = NextResponse.next({ request: { headers } });

  if (!existing) {
    response.cookies.set({
      name: VISITOR_COOKIE,
      value: visitorId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
  }
  return response;
}

export const config = {
  // Bỏ qua Next internals, route handler `/api/*` (không có locale — backend
  // gọi thẳng, thêm prefix là gãy) và file tĩnh (có phần mở rộng).
  matcher: ["/((?!_next|api/|.*\\..*).*)"],
};
