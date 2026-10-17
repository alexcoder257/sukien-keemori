"use client";

import { API_BASE_URL } from "./config";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./token";

export class ApiError extends Error {
  status: number;
  /**
   * Mã lỗi máy đọc được (`constants/http.ts` → `API_ERROR_CODES`), `null` với
   * phần lớn lỗi. Chỉ dùng để rẽ nhánh; câu hiển thị vẫn là `message`.
   */
  code: string | null;
  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return String(m[0] ?? fallback);
    if (typeof m === "string") return m;
  }
  return fallback;
}

function extractCode(body: unknown): string | null {
  if (body && typeof body === "object" && "code" in body) {
    const code = (body as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean; // gắn Authorization header (mặc định true)
  _retried?: boolean; // cờ nội bộ tránh refresh lặp vô hạn
}

// Gọi /auth/refresh trực tiếp (không qua request() để tránh vòng lặp refresh).
// Export để các luồng không đi qua `request()` dùng lại được.
export async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers, _retried, ...rest } = options;

  const finalHeaders = new Headers(headers);
  // `FormData` phải đi nguyên vẹn: `Content-Type` của nó có kèm `boundary` do
  // trình duyệt sinh, đặt tay đè lên là server không tách được phần tệp.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  // Access token hết hạn → thử refresh một lần rồi retry.
  if (res.status === 401 && auth && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, _retried: true });
    }
    clearTokens();
  }

  if (res.status === 204) return undefined as T;

  const data = res.headers.get("content-type")?.includes("application/json")
    ? await res.json()
    : null;

  if (!res.ok) {
    throw new ApiError(
      extractMessage(data, "Có lỗi xảy ra, vui lòng thử lại."),
      res.status,
      extractCode(data),
    );
  }

  return data as T;
}
