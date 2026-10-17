"use client";

import { API_BASE_URL } from "./config";
import { ApiError, request } from "./http";

/**
 * Đường ảnh của editor: ảnh lên **vùng tạm** ngay lúc chọn — kể cả khi chưa
 * đăng nhập — rồi được **nhận về thiệp** lúc bấm Lưu. Toàn bộ lý do nằm ở
 * `backend/src/modules/storage/upload-staging.service.ts`; phía client xem
 * `lib/photo-staging.ts`.
 *
 * Quyền trên vùng tạm là **token phiên** (header `X-Upload-Session`), không phải
 * tài khoản.
 */

export const UPLOAD_SESSION_HEADER = "X-Upload-Session";

export type StagedPhotoKind = "photo" | "album";

export interface UploadSessionToken {
  token: string;
  /** ISO. */
  expiresAt: string;
}

export interface StagedUploadTarget {
  /** Presigned URL của R2, hoặc đường dẫn tương đối của backend (driver `local`). */
  url: string;
  method: "PUT";
  /** Header bắt buộc — R2 ký cả `Content-Type`, gửi khác là 403. */
  headers: Record<string, string>;
}

export interface StagedPhotoView {
  id: string;
  status: "uploading" | "processing" | "published" | "failed";
  url?: string;
  error?: string;
}

export function createUploadSession(): Promise<UploadSessionToken> {
  // Gắn token đăng nhập nếu có (để ảnh đi hàng ưu tiên của người đã đăng
  // nhập), nhưng route không bắt buộc.
  return request<UploadSessionToken>("/upload-sessions", { method: "POST" });
}

export function requestStagedUploads(
  session: string,
  items: { kind: StagedPhotoKind; contentType: string; size: number }[],
): Promise<{ id: string; upload: StagedUploadTarget }[]> {
  return request("/upload-sessions/photos", {
    method: "POST",
    body: { items },
    // Chỉ cần token phiên. Gắn token đăng nhập thì 401 "phiên tải hết hạn" sẽ
    // bị `request()` hiểu nhầm là access token hết hạn và đốt một lượt refresh.
    auth: false,
    headers: { [UPLOAD_SESSION_HEADER]: session },
  });
}

export function completeStagedUploads(
  session: string,
  ids: string[],
): Promise<StagedPhotoView[]> {
  return request("/upload-sessions/photos/complete", {
    method: "POST",
    body: { ids },
    auth: false,
    headers: { [UPLOAD_SESSION_HEADER]: session },
  });
}

export function removeStagedPhoto(session: string, id: string): Promise<void> {
  return request<void>(`/upload-sessions/photos/${id}`, {
    method: "DELETE",
    auth: false,
    headers: { [UPLOAD_SESSION_HEADER]: session },
  });
}

/** Nhận ảnh về thiệp — bên gọi lặp lại cho tới khi mọi tấm xong. */
export function claimStagedPhotos(
  session: string,
  cardId: string,
  ids: string[],
): Promise<StagedPhotoView[]> {
  return request("/upload-sessions/claim", {
    method: "POST",
    body: { cardId, ids },
    headers: { [UPLOAD_SESSION_HEADER]: session },
  });
}

/**
 * Bản đã nén (AVIF) của một tấm còn trong vùng tạm — để dựng lại ô ảnh khi
 * khôi phục bản nháp sau một lần tải lại trang. Đi bằng `fetch` trần chứ không
 * qua `request()` vì thứ trả về là byte ảnh, không phải JSON.
 *
 * Hỏng thì ném `ApiError` mang đúng `status`/`code` của backend: `409` +
 * `stagedPhotoProcessing` nghĩa là đợi rồi hỏi lại, còn lại là ảnh đã mất.
 */
export async function fetchStagedPreview(
  session: string,
  id: string,
  signal?: AbortSignal,
): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/upload-sessions/photos/${id}/preview`,
      {
        headers: { [UPLOAD_SESSION_HEADER]: session },
        cache: "no-store",
        signal,
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(previewFailedMessage, 0);
  }
  if (response.ok) return response.blob();

  const body: unknown = await response.json().catch(() => null);
  const code =
    body && typeof body === "object" && "code" in body
      ? String((body as { code: unknown }).code)
      : null;
  throw new ApiError(previewFailedMessage, response.status, code);
}

const previewFailedMessage = "Không tải được ảnh đã chọn.";

/**
 * Gửi byte ảnh thẳng tới đích backend đã cấp. Dùng `XMLHttpRequest` chứ không
 * `fetch` vì `fetch` không báo tiến độ gửi lên, mà ảnh trên 3G/4G là thứ mất
 * vài giây — một thanh tiến độ đứng im đọc ra như treo máy.
 *
 * Không gắn `Authorization`: presigned URL tự mang chữ ký, và gửi token đăng
 * nhập của mình sang tên miền của R2 là rò rỉ không cần thiết.
 */
export function putStagedFile(
  target: StagedUploadTarget,
  file: Blob,
  session: string,
  {
    onProgress,
    signal,
  }: { onProgress?: (ratio: number) => void; signal?: AbortSignal } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const isBackend = target.url.startsWith("/");
    const xhr = new XMLHttpRequest();
    xhr.open(
      target.method,
      isBackend ? `${API_BASE_URL}${target.url}` : target.url,
    );
    for (const [name, value] of Object.entries(target.headers)) {
      xhr.setRequestHeader(name, value);
    }
    if (isBackend) xhr.setRequestHeader(UPLOAD_SESSION_HEADER, session);

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort);
    const cleanup = () => signal?.removeEventListener("abort", onAbort);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      // Chặn ở 0.99: byte cuối rời trình duyệt chưa có nghĩa là tấm ảnh đã
      // được nhận — còn bước báo xong. Nhảy lên 100% rồi đứng im là nói dối.
      onProgress?.(Math.min(event.loaded / event.total, 0.99));
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new ApiError(uploadFailedMessage, xhr.status));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new ApiError(uploadFailedMessage, 0));
    };
    xhr.onabort = () => {
      cleanup();
      reject(abortError());
    };

    xhr.send(file);
  });
}

const uploadFailedMessage = "Không tải được ảnh lên, vui lòng thử lại.";

function abortError(): DOMException {
  return new DOMException("Đã huỷ tải ảnh", "AbortError");
}
