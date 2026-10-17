import "server-only";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, API_BASE_URL } from "@/apis/config";

/**
 * Địa chỉ backend mà **tiến trình server** của Next gọi tới — bản sao có chủ
 * đích của `frontend/lib/data/api.ts` (xem chú thích dài ở đó).
 *
 * Tóm tắt: `API_BASE_URL` bị nướng vào bundle trình duyệt lúc build nên phải
 * là địa chỉ công khai; tiến trình server thì nằm trong mạng nội bộ, nơi
 * `localhost` trỏ vào chính container này chứ không phải backend.
 */
const SERVER_API_BASE_URL = process.env.INTERNAL_API_URL || API_BASE_URL;

/**
 * Gọi backend từ **Server Component**.
 *
 * Tách hẳn khỏi `apis/http.ts`: file đó là `"use client"` và đọc token từ
 * `localStorage`/cookie của trình duyệt, nên không dùng được ở server. Ở đây
 * token lấy từ cookie store của request đang xử lý.
 *
 * `apis/` là nơi của hàm HTTP client-side; helper server-only thì theo
 * `CLAUDE.md` mục 3 phải nằm ở `lib/data/`.
 */

interface FetchOptions {
  /**
   * Số giây Next giữ lại kết quả. Next 16 (chưa bật `cacheComponents`) **không
   * cache `fetch` mặc định**, nên nội dung ít đổi phải tự khai — nếu không thì
   * mỗi lượt xem trang chủ là một lượt truy vấn xuống Postgres.
   */
  revalidate?: number;
  /** Gắn access token của phiên hiện tại. Dùng cho dữ liệu riêng của người dùng. */
  auth?: boolean;
}

/** Nhịp revalidate dùng chung, đặt tên theo mức độ đổi của dữ liệu. */
export const REVALIDATE = {
  /** Kho mẫu, bảng giá, FAQ: đổi khi admin cấu hình lại. */
  config: 300,
  /** Lời chứng thực: đổi theo đợt biên tập. */
  editorial: 600,
} as const;

export class ApiFetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiFetchError";
  }
}

async function authHeader(): Promise<HeadersInit | undefined> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/**
 * Ném `ApiFetchError` khi backend trả lỗi. Trang gọi hàm này quyết định xử lý
 * ra sao — `notFound()` với 404, hoặc để lỗi nổi lên `error.tsx`.
 */
export async function serverFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { revalidate, auth } = options;

  const response = await fetch(`${SERVER_API_BASE_URL}${path}`, {
    headers: auth ? await authHeader() : undefined,
    // Dữ liệu gắn với người dùng không bao giờ được cache dùng chung: hai người
    // khác nhau phải thấy hai kết quả khác nhau.
    ...(auth || revalidate === undefined
      ? { cache: "no-store" as const }
      : { next: { revalidate } }),
  });

  if (!response.ok) {
    throw new ApiFetchError(
      `${options.auth ? "[auth] " : ""}GET ${path} → ${response.status}`,
      response.status,
    );
  }
  return (await response.json()) as T;
}

/**
 * Như `serverFetch` nhưng trả `null` thay vì ném khi backend nói 404.
 * Dùng cho trang chi tiết: "không có" là một trạng thái bình thường, còn 500
 * thì vẫn phải nổi lên chứ không được lẫn thành "không tìm thấy".
 */
export async function serverFetchOrNull<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T | null> {
  try {
    return await serverFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiFetchError && error.status === 404) return null;
    throw error;
  }
}
