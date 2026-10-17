import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/apis/config";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  clearTokenCookies,
  dashboardUrl,
  revokeSession,
} from "@/lib/admin-auth";

/**
 * Đăng xuất: thu hồi refresh token ở backend rồi xoá cookie của dashboard.
 * Chỉ xoá cookie thì refresh token vẫn sống ở backend tới hết 10 tiếng — ai
 * chép được nó trước đó vẫn dùng tiếp.
 *
 * `POST` từ form ở sidebar: một link `GET` thì trang lạ nào cũng đăng xuất
 * được người vận hành bằng một thẻ `<img>`.
 */
export async function POST(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) await revokeSession(accessToken);

  // 303: trình duyệt đổi POST thành GET khi đi theo chuyển hướng.
  const response = NextResponse.redirect(
    dashboardUrl(request, `/${locale}/dang-nhap`),
    303,
  );
  clearTokenCookies(response);
  return response;
}
