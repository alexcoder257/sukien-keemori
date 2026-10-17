"use client";

import {
  ApiError,
  claimStagedPhotos,
  completeStagedUploads,
  createUploadSession,
  putStagedFile,
  removeStagedPhoto,
  requestStagedUploads,
  type StagedPhotoKind,
  type StagedUploadTarget,
} from "@/apis";
import { API_ERROR_CODES } from "@/constants/http";
import {
  beginUpload,
  clearStagedPhotoId,
  failUpload,
  finishUpload,
  isBlobPhoto,
  isUploading,
  markPhotoUploaded,
  pendingPhotoFile,
  replacePendingFile,
  setUploadProgress,
  stagedPhotoId,
} from "@/lib/album-uploads";
import { prepareUploadFile } from "@/lib/image-resize";

/**
 * Đường ảnh của editor, phía client:
 *
 * 1. **Chọn ảnh** → thu nhỏ trong trình duyệt → xin chỗ gửi (theo lô) → `PUT`
 *    thẳng lên vùng tạm (R2) → báo xong (theo lô). Chạy cả khi **chưa đăng
 *    nhập** — quyền trên vùng tạm là token phiên, không phải tài khoản.
 * 2. **Bấm Lưu** → nhận các tấm đó về thiệp (`claimPhotos`), lặp lại cho tới
 *    khi server nén xong và chép sang kho công khai.
 *
 * Trước đây khách chưa đăng nhập không gửi được gì; đăng nhập xong là cả album
 * đổ lên một lúc, đúng khoảng chờ mà việc tải sớm sinh ra để tránh. Toàn bộ lý
 * do phía server: `backend/src/modules/storage/upload-staging.service.ts`.
 *
 * Module-level chứ không phải hook: lượt Lưu (`hooks/use-card.ts`) và ô chọn ảnh
 * cùng dùng một hàng đợi, một phiên.
 */

const SESSION_STORAGE_KEY = "thiep:upload-session";

/**
 * Coi phiên là đã hết sớm hơn hạn thật một giờ: một phiên sắp hết mà vẫn được
 * dùng để gửi ảnh thì tới lúc Lưu đã chết, và cả album phải gửi lại.
 */
const SESSION_SAFETY_MARGIN_MS = 60 * 60 * 1000;

/**
 * Số ảnh gửi cùng lúc. Byte giờ đi thẳng lên R2 nên server không phải là cổ
 * chai nữa; cổ chai là băng thông gửi lên của khách, và mở thêm luồng trên 4G
 * không nhanh hơn, chỉ làm mọi tấm cùng chậm.
 */
const UPLOAD_CONCURRENCY = 3;

/** Gom các tấm vừa thu nhỏ xong thành một lượt xin chỗ gửi. */
const REQUEST_BATCH_SIZE = 8;
/** Gom các tấm vừa gửi xong thành một lượt báo xong. */
const COMPLETE_DEBOUNCE_MS = 250;
/** Trần của backend cho một lượt (`MAX_PHOTOS_PER_BATCH`). */
const MAX_BATCH = 40;

/** Nhịp hỏi lại lúc Lưu, khi server còn đang nén. */
const CLAIM_POLL_MS = 1000;
/**
 * Đợi nén tối đa bấy lâu rồi báo người dùng thử lại. Bấm lưu lại sau đó vẫn
 * nhanh: ảnh đã nằm trong hàng đợi và tiếp tục được nén.
 */
const CLAIM_TIMEOUT_MS = 3 * 60 * 1000;

export type PhotoStagingFailure = "failed" | "timeout";

/** Lượt Lưu không nhận được đủ ảnh — `reason` quyết định câu báo lỗi. */
export class PhotoStagingError extends Error {
  constructor(readonly reason: PhotoStagingFailure) {
    super(`Photo staging ${reason}`);
    this.name = "PhotoStagingError";
  }
}

/* ------------------------------------------------------------------ *
 * Phiên
 * ------------------------------------------------------------------ */

let creatingSession: Promise<string> | null = null;
/** Phiên dự phòng khi `localStorage` bị chặn (chế độ riêng tư). */
let memorySession: string | null = null;

function storedSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return memorySession;
    const { token, expiresAt } = JSON.parse(raw) as {
      token?: string;
      expiresAt?: string;
    };
    if (!token || !expiresAt) return memorySession;
    const left = new Date(expiresAt).getTime() - Date.now();
    return left > SESSION_SAFETY_MARGIN_MS ? token : null;
  } catch {
    return memorySession;
  }
}

/**
 * Token phiên đang giữ ảnh của editor, **không** trừ khoảng an toàn như
 * `storedSession`: bản nháp cất token này để đọc lại đúng những tấm đã gửi, và
 * một phiên còn nửa giờ vẫn đọc được — chỉ là không nên gửi thêm ảnh vào nó.
 */
export function uploadSessionToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return memorySession;
    const { token, expiresAt } = JSON.parse(raw) as {
      token?: string;
      expiresAt?: string;
    };
    if (!token || !expiresAt) return memorySession;
    return new Date(expiresAt).getTime() > Date.now() ? token : null;
  } catch {
    return memorySession;
  }
}

/**
 * Phiên nằm trong `localStorage` để **sống qua vòng đăng nhập** — đăng nhập
 * bằng Google là một lần điều hướng thật, bộ nhớ của trang mất sạch. Mất
 * phiên nghĩa là mọi ảnh đã gửi phải gửi lại.
 */
async function ensureSession(): Promise<string> {
  const stored = storedSession();
  if (stored) return stored;
  creatingSession ??= createUploadSession()
    .then(({ token, expiresAt }) => {
      try {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ token, expiresAt }),
        );
      } catch {
        // Chế độ riêng tư chặn storage: phiên vẫn dùng được cho tới khi rời
        // trang, chỉ không sống qua vòng đăng nhập.
        memorySession = token;
      }
      return token;
    })
    .finally(() => {
      creatingSession = null;
    });
  return creatingSession;
}

function resetSession() {
  memorySession = null;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Không có gì để xoá.
  }
}

function isSessionInvalid(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.code === API_ERROR_CODES.uploadSessionInvalid
  );
}

/* ------------------------------------------------------------------ *
 * Gửi lên vùng tạm
 * ------------------------------------------------------------------ */

type Prepared = { url: string; kind: StagedPhotoKind; file: File };

/** Tín hiệu huỷ của từng tấm — `releasePhoto` huỷ, `PUT` dừng giữa chừng. */
const uploadSignals = new Map<string, AbortSignal>();

/** Mỗi tấm đang chạy giữ một lời hứa, để lượt Lưu đợi đúng tấm của nó. */
const settling = new Map<string, Promise<void>>();
const settleResolvers = new Map<string, () => void>();

function settle(url: string) {
  settleResolvers.get(url)?.();
  settleResolvers.delete(url);
  settling.delete(url);
  uploadSignals.delete(url);
}

function fail(url: string) {
  failUpload(url);
  settle(url);
}

/** Hàng đợi `PUT`, chạy tối đa `UPLOAD_CONCURRENCY` tấm một lúc. */
const putQueue: (() => Promise<void>)[] = [];
let runningPuts = 0;

function pump() {
  while (runningPuts < UPLOAD_CONCURRENCY && putQueue.length > 0) {
    runningPuts += 1;
    void (async () => {
      for (let task = putQueue.shift(); task; task = putQueue.shift()) {
        await task();
      }
      runningPuts -= 1;
    })();
  }
}

/** Các tấm đã `PUT` xong, chờ gom thành một lượt báo xong. */
let completeBuffer: { url: string; id: string }[] = [];
let completeTimer: ReturnType<typeof setTimeout> | null = null;

function queueComplete(url: string, id: string) {
  completeBuffer.push({ url, id });
  if (completeBuffer.length >= MAX_BATCH) {
    void flushComplete();
    return;
  }
  completeTimer ??= setTimeout(
    () => void flushComplete(),
    COMPLETE_DEBOUNCE_MS,
  );
}

async function flushComplete() {
  if (completeTimer) clearTimeout(completeTimer);
  completeTimer = null;
  const batch = completeBuffer;
  completeBuffer = [];
  if (batch.length === 0) return;

  try {
    const session = await ensureSession();
    const views = await completeStagedUploads(
      session,
      batch.map((item) => item.id),
    );
    const byId = new Map(views.map((view) => [view.id, view]));
    for (const { url, id } of batch) {
      if (byId.get(id)?.status === "failed") {
        clearStagedPhotoId(url);
        fail(url);
        continue;
      }
      finishUpload(url, id);
      settle(url);
    }
  } catch (error) {
    if (isSessionInvalid(error)) resetSession();
    for (const { url } of batch) fail(url);
  }
}

/** Xin chỗ gửi cho một lô đã thu nhỏ xong, rồi xếp từng tấm vào hàng `PUT`. */
async function requestAndEnqueue(batch: Prepared[], retried = false) {
  let session: string;
  let targets: { id: string; upload: StagedUploadTarget }[];
  try {
    session = await ensureSession();
    targets = await requestStagedUploads(
      session,
      batch.map(({ kind, file }) => ({
        kind,
        contentType: file.type,
        size: Math.max(1, file.size),
      })),
    );
  } catch (error) {
    if (isSessionInvalid(error) && !retried) {
      resetSession();
      return requestAndEnqueue(batch, true);
    }
    for (const { url } of batch) fail(url);
    return;
  }

  batch.forEach(({ url, file }, index) => {
    const target = targets[index];
    putQueue.push(async () => {
      // Người dùng gỡ tấm này trong lúc chờ: `releasePhoto` đã huỷ lượt tải.
      if (!isUploading(url)) {
        settle(url);
        return;
      }
      try {
        await putStagedFile(target.upload, file, session, {
          onProgress: (ratio) => setUploadProgress(url, ratio),
          signal: uploadSignals.get(url),
        });
        queueComplete(url, target.id);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          settle(url);
          return;
        }
        fail(url);
      }
    });
  });
  pump();
}

/**
 * Gửi một lô ảnh vừa chọn lên vùng tạm. Không chặn: trả về ngay, trạng thái
 * từng tấm đi qua `lib/album-uploads` (lớp phủ tiến độ trên ô ảnh).
 *
 * Thu nhỏ **từng tấm một** rồi mới xin chỗ gửi, vì định dạng sau khi thu nhỏ
 * (JPEG, hoặc giữ nguyên) là thứ phải ký vào URL. Tấm nào xong trước thì đi
 * trước: không đợi cả album thu nhỏ xong mới gửi tấm đầu.
 */
export function stagePhotos(urls: string[], kind: StagedPhotoKind): void {
  const targets = urls.filter(
    (url) =>
      isBlobPhoto(url) &&
      !stagedPhotoId(url) &&
      !isUploading(url) &&
      pendingPhotoFile(url),
  );
  if (targets.length === 0) return;

  for (const url of targets) {
    uploadSignals.set(url, beginUpload(url));
    settling.set(
      url,
      new Promise<void>((resolve) => settleResolvers.set(url, resolve)),
    );
  }

  void (async () => {
    let batch: Prepared[] = [];
    for (const url of targets) {
      const original = pendingPhotoFile(url);
      if (!original || !isUploading(url)) {
        settle(url);
        continue;
      }
      // Thu nhỏ tuần tự: giải mã song song vài ảnh 48MP là cách nhanh nhất để
      // Safari iOS giết tab.
      const file = await prepareUploadFile(original);
      if (!isUploading(url)) {
        settle(url);
        continue;
      }
      replacePendingFile(url, file);
      batch.push({ url, kind, file });
      if (batch.length >= REQUEST_BATCH_SIZE) {
        void requestAndEnqueue(batch);
        batch = [];
      }
    }
    if (batch.length > 0) void requestAndEnqueue(batch);
  })();
}

/**
 * Gỡ một tấm khỏi ô trước khi lưu: huỷ lượt gửi nếu còn đang chạy, và xoá nó
 * khỏi vùng tạm. Xoá hỏng thì im lặng — cron của server dọn nốt sau một ngày.
 */
export function unstagePhoto(url: string): void {
  const id = stagedPhotoId(url);
  const session = storedSession();
  if (id && session) void removeStagedPhoto(session, id).catch(() => {});
  settle(url);
}

/* ------------------------------------------------------------------ *
 * Nhận về thiệp
 * ------------------------------------------------------------------ */

export type PendingPhoto = { url: string; kind: StagedPhotoKind };

/** Đợi mọi tấm trong danh sách đã nằm trong vùng tạm, gửi nốt tấm còn thiếu. */
async function ensureStaged(photos: PendingPhoto[]): Promise<void> {
  const byKind = new Map<StagedPhotoKind, string[]>();
  for (const { url, kind } of photos) {
    if (stagedPhotoId(url) || isUploading(url)) continue;
    byKind.set(kind, [...(byKind.get(kind) ?? []), url]);
  }
  for (const [kind, urls] of byKind) stagePhotos(urls, kind);
  await Promise.all(photos.map(({ url }) => settling.get(url)));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

/**
 * Nhận mọi ảnh còn chờ về thiệp `cardId`; trả bản đồ URL `blob:` → URL thật.
 *
 * Gọi lặp lại cho tới khi server nén xong và chép xong từng tấm. Mỗi lượt gọi
 * còn đẩy ảnh của thiệp này lên đầu hàng đợi nén, nên người đang ngồi đợi nút
 * Lưu không phải xếp sau ảnh của người khác.
 *
 * Tự sửa hai kiểu hỏng, mỗi kiểu **một lần**: tấm nào server báo hỏng thì gửi
 * lại từ bản còn trong trình duyệt; phiên hết hạn thì mở phiên mới và gửi lại
 * cả lô. Hỏng lần hai thì ném `PhotoStagingError` để editor báo người dùng.
 */
export async function claimPhotos(
  cardId: string,
  photos: PendingPhoto[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const total = photos.length;
  const resolved = new Map<string, string>();
  const pending = new Map(photos.map(({ url, kind }) => [url, kind]));
  const retried = new Set<string>();
  let sessionRetried = false;
  const deadline = Date.now() + CLAIM_TIMEOUT_MS;

  onProgress?.(0, total);

  while (pending.size > 0) {
    await ensureStaged([...pending].map(([url, kind]) => ({ url, kind })));

    const ids = new Map<string, string>();
    for (const url of pending.keys()) {
      const id = stagedPhotoId(url);
      if (!id) {
        // Gửi lại mà vẫn hỏng, hoặc không còn tệp trong trình duyệt.
        if (retried.has(url)) throw new PhotoStagingError("failed");
        retried.add(url);
        continue;
      }
      ids.set(id, url);
    }
    if (ids.size === 0) continue;

    let views;
    try {
      const session = await ensureSession();
      views = (
        await Promise.all(
          chunks([...ids.keys()], MAX_BATCH).map((batch) =>
            claimStagedPhotos(session, cardId, batch),
          ),
        )
      ).flat();
    } catch (error) {
      if (isSessionInvalid(error) && !sessionRetried) {
        sessionRetried = true;
        resetSession();
        for (const url of pending.keys()) clearStagedPhotoId(url);
        continue;
      }
      throw error;
    }

    let waiting = false;
    for (const view of views) {
      const url = ids.get(view.id);
      if (!url) continue;
      if (view.status === "published" && view.url) {
        markPhotoUploaded(url, view.url);
        resolved.set(url, view.url);
        pending.delete(url);
      } else if (view.status === "failed") {
        if (retried.has(url)) throw new PhotoStagingError("failed");
        retried.add(url);
        clearStagedPhotoId(url);
      } else {
        waiting = true;
      }
    }
    onProgress?.(resolved.size, total);

    if (pending.size > 0 && waiting) {
      if (Date.now() > deadline) throw new PhotoStagingError("timeout");
      await sleep(CLAIM_POLL_MS);
    }
  }

  return resolved;
}
