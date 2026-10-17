import "server-only";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, API_BASE_URL } from "@/apis/config";

/**
 * Địa chỉ backend mà **tiến trình server** của Next gọi tới.
 *
 * Khác `API_BASE_URL` một cách có chủ đích, và đây là chỗ dễ sai nhất khi đóng
 * gói bằng Docker: `API_BASE_URL` đến từ `NEXT_PUBLIC_API_URL`, vốn bị nướng
 * vào bundle **trình duyệt** lúc build nên bắt buộc phải là địa chỉ công khai
 * (`https://api.tenmien.com`). Nhưng tiến trình server lại nằm trong mạng nội
 * bộ, nơi tên đó có thể không phân giải được — trong compose, `localhost` của
 * container frontend chính là container frontend, không phải backend.
 *
 * Để trống thì hai đường trùng nhau, đúng cho máy dev. Trong compose thì đặt
 * `INTERNAL_API_URL=http://backend:3001`: request đi thẳng giữa hai container,
 * không vòng ra Internet rồi quay lại.
 *
 * Chỉ dùng ở đây. `apis/http.ts` chạy trong trình duyệt nên vẫn phải là
 * `API_BASE_URL`.
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
  /**
   * Tag cache để xoá theo yêu cầu: backend gọi `POST /api/revalidate` sau khi
   * admin lưu cấu hình, nên nội dung đổi hiện ra ngay thay vì chờ hết
   * `revalidate`. Chỉ có nghĩa khi đi kèm `revalidate`.
   */
  tags?: string[];
  /** Gắn access token của phiên hiện tại. Dùng cho dữ liệu riêng của người dùng. */
  auth?: boolean;
  /**
   * Header thêm cho riêng lời gọi này. Dữ liệu gắn với người xem cụ thể, nên
   * chỗ nào truyền header này thì cũng không được kèm `revalidate`: cache dùng
   * chung mà chứa kết quả của một người là sai người.
   */
  headers?: Record<string, string>;
}

/**
 * Nhịp revalidate dùng chung, đặt tên theo mức độ đổi của dữ liệu.
 *
 * Hai con số này **không còn là "bao lâu thì nội dung mới hiện ra"**. Mọi nguồn
 * dùng chúng đều đã có tag (`constants/cache-tags.ts`) và backend bắn
 * `POST /api/revalidate` ngay khi admin bấm Lưu, nên nội dung mới hiện ra
 * trong vài trăm mili giây bất kể con số ở đây là bao nhiêu.
 *
 * Vai trò thật của chúng là **lưới an toàn**: nếu cú ping bị rớt (frontend
 * đang deploy, sai secret, mạng chập), cache vẫn tự làm mới sau chừng này.
 *
 * Vì vậy nhịp được nới từ 5–10 phút lên hàng giờ. Đó chính là chỗ giảm tải:
 * trước đây mỗi 5 phút là một lượt truy vấn xuống Postgres cho **mỗi** nguồn
 * dữ liệu của mỗi trang, kể cả khi cả tuần không ai sửa gì.
 */
export const REVALIDATE = {
  /** Kho mẫu, bảng giá, FAQ, cấu hình: đổi khi admin cấu hình lại. */
  config: 60 * 60,
  /** Lời chứng thực, nội dung trang chủ: đổi theo đợt biên tập. */
  editorial: 6 * 60 * 60,
  /**
   * Lời chúc đã duyệt trên một tấm thiệp. Ngắn hơn hẳn hai nhịp trên vì đây là
   * dữ liệu của khách mời chứ không phải nội dung biên tập: chủ thiệp duyệt
   * một lời chúc rồi mở lại thiệp để kiểm tra ngay, nên lưới an toàn phải đỡ
   * được trong khoảng thời gian đó chứ không phải sau vài giờ.
   */
  wishes: 5 * 60,
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
  const { revalidate, tags, auth, headers } = options;

  const response = await fetch(`${SERVER_API_BASE_URL}${path}`, {
    headers: { ...(auth ? await authHeader() : undefined), ...headers },
    // Dữ liệu gắn với người dùng không bao giờ được cache dùng chung: hai người
    // khác nhau phải thấy hai kết quả khác nhau.
    ...(auth || revalidate === undefined
      ? { cache: "no-store" as const }
      : { next: { revalidate, tags } }),
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
