import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  loginWithPassword,
  safeNextPath,
  writeTokenCookies,
} from "@/lib/admin-auth";

interface LoginBody {
  email?: unknown;
  /** SHA-256 hex của mật khẩu — form băm trước khi gửi, backend kiểm dạng. */
  password?: unknown;
  next?: unknown;
  locale?: unknown;
}

/** Mã lỗi form đăng nhập tra trong `auth.errors` của từ điển. */
type LoginError = "invalid" | "throttled" | "unavailable";

function fail(error: LoginError, status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * Đăng nhập bằng email + mật khẩu: chuyển tiếp xuống backend, ghi cookie phiên,
 * trả về đường dẫn để form tự điều hướng.
 *
 * Chỉ nhận `application/json`: một `<form>` ở trang lạ không gửi được kiểu đó
 * mà không qua preflight CORS, nên trang lạ không đăng nhập hộ người vận hành
 * vào một tài khoản do kẻ khác chọn (login CSRF).
 */
export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return fail("invalid", 415);
  }
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const locale =
    typeof body.locale === "string" && isLocale(body.locale)
      ? body.locale
      : defaultLocale;
  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return fail("invalid", 400);
  }

  let result;
  try {
    result = await loginWithPassword(request, {
      email: body.email.trim().toLowerCase(),
      password: body.password,
    });
  } catch {
    return fail("unavailable", 503);
  }

  if (!result.ok) {
    if (result.status === 429) return fail("throttled", 429);
    if (result.status === 400 || result.status === 401) {
      return fail("invalid", 401);
    }
    return fail("unavailable", 503);
  }

  const response = NextResponse.json({
    redirect: safeNextPath(
      typeof body.next === "string" ? body.next : null,
      `/${locale}`,
    ),
  });
  writeTokenCookies(response, result.tokens);
  return response;
}
