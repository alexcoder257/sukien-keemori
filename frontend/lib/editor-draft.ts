"use client";

import { ApiError, fetchStagedPreview } from "@/apis";
import { API_ERROR_CODES } from "@/constants/http";
import {
  adoptPhoto,
  isBlobPhoto,
  releasePhoto,
  stagedPhotoId,
} from "@/lib/album-uploads";
import { uploadSessionToken } from "@/lib/photo-staging";
import type { InvitationContent } from "@/lib/schemas/invitation";

const KEY_PREFIX = "thiep:editor-draft:";
/**
 * Bản nháp chỉ để sống sót qua một lần mất trang, không phải chỗ lưu trữ lâu
 * dài — thiệp thật nằm ở backend. Bằng đúng tuổi của phiên tải ảnh
 * (`UPLOAD_SESSION_TTL_MS` bên backend): quá hạn này thì ảnh trong vùng tạm đã
 * bị dọn, nháp trả về chỉ còn chữ.
 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Kho IndexedDB của định dạng cũ — nó cất byte ảnh, nặng vài chục MB. */
const LEGACY_DB_NAME = "thiep-editor-draft";

/** Số ảnh tải về cùng lúc khi dựng lại nháp. */
const RESTORE_CONCURRENCY = 4;
/** Ảnh còn trong hàng đợi nén: nhịp hỏi lại và thời gian đợi tối đa. */
const PROCESSING_RETRY_MS = 2000;
/**
 * Đợi lâu ngang lượt Lưu (`CLAIM_TIMEOUT_MS` ở `lib/photo-staging.ts`). Server
 * nén từng tấm một và ảnh ẩn danh xếp cuối hàng, nên album vài chục tấm vừa
 * chọn trước vòng đăng nhập có thể cần 1–2 phút mới nén hết. Từng đặt 20 giây:
 * quá mốc đó mọi tấm chưa nén xong bị coi là mất, bị gỡ khỏi form, và lượt tự
 * cất kế tiếp xoá luôn id của chúng khỏi nháp — ảnh vẫn nằm nguyên trên server
 * mà người dùng không còn đường lấy lại. Trong lúc đợi, nháp **không** bị ghi
 * đè (`draftLoadedRef` ở editor), nên tải lại trang giữa chừng vẫn an toàn.
 */
const PROCESSING_MAX_WAIT_MS = 3 * 60 * 1000;

function key(templateSlug: string): string {
  return `${KEY_PREFIX}${templateSlug}`;
}

/**
 * Bản nháp của **thiệp chưa lưu lần nào**, tự cất khi đang soạn.
 *
 * Lý do tồn tại: trình duyệt trong app Facebook/Zalo bị iOS giết khi người
 * dùng sang app khác (lấy link Google Maps, xem ảnh), rồi tải lại trang lúc họ
 * quay về. Khách chưa đăng nhập thì backend không có chỗ nào giữ nội dung cho
 * họ, nên trước đây mỗi lần như vậy là mất sạch — đúng một ca thật đã phải chọn
 * lại toàn bộ ảnh hai lần trong một buổi tối.
 *
 * **Nháp không cất byte ảnh**, chỉ cất id của ảnh trong vùng tạm cùng token
 * phiên: mọi ảnh đã được gửi lên đó ngay lúc chọn (`lib/photo-staging.ts`), và
 * khôi phục thì tải lại bản đã nén qua `fetchStagedPreview`. Nhờ vậy nháp chỉ
 * vài KB và nằm được trong `localStorage` — ghi **đồng bộ**, nên lượt cất lúc
 * trang bị ẩn xong hẳn trước khi iOS kịp đóng băng trang. Ảnh chưa kịp lên
 * vùng tạm thì mất, và người dùng được báo chọn lại.
 */
type DraftRecord = {
  version: 2;
  savedAt: number;
  /** URL ảnh trong đây là `blob:` của trang đã chết — chỉ dùng làm khoá. */
  content: InvitationContent;
  /** URL `blob:` → id trong vùng tạm, cho những tấm đã lên tới đó. */
  photos: Record<string, string>;
  /** Token phiên đang giữ các tấm ở trên. */
  session: string | null;
};

/** Một vị trí trong album: ảnh sẵn có (URL thật) hoặc ảnh chờ tải lại. */
type AlbumEntry = { url: string } | { id: string };

export type StoredDraft = {
  /** Nội dung đã gỡ mọi URL `blob:` chết — đổ thẳng vào form được ngay. */
  content: InvitationContent;
  /** Ô ảnh chờ tải lại từ vùng tạm: `[khoá ô, id]`. */
  slots: [string, string][];
  /** Album theo đúng thứ tự cũ, gồm cả tấm chờ tải lại. */
  album: AlbumEntry[];
  session: string | null;
  /** Có tấm không còn đường lấy lại (chưa kịp lên vùng tạm, hoặc nháp cũ). */
  photosLost: boolean;
  sharePhotoId?: string;
};

export type RestoredPhotos = {
  sharePhotoUrl?: string;
  photos: Record<string, string>;
  album: string[];
  /** Có tấm tải lại không được (hết hạn, phiên đã dọn, mất mạng). */
  lost: boolean;
};

function photoUrls(content: InvitationContent): string[] {
  return [...Object.values(content.photos), ...content.album.photos];
}

/**
 * Cất nội dung đang soạn. Đồng bộ và không bao giờ ném lỗi: hết dung lượng
 * hay chế độ riêng tư chặn storage thì mất nháp là tiếc, nhưng làm hỏng một
 * lần gõ phím thì tệ hơn nhiều.
 */
export function saveDraft(templateSlug: string, content: InvitationContent) {
  const photos: Record<string, string> = {};
  for (const url of photoUrls(content)) {
    if (!isBlobPhoto(url)) continue;
    const id = stagedPhotoId(url);
    if (id) photos[url] = id;
  }
  const record: DraftRecord = {
    version: 2,
    savedAt: Date.now(),
    content,
    photos,
    session: uploadSessionToken(),
  };
  try {
    localStorage.setItem(key(templateSlug), JSON.stringify(record));
  } catch {
    // Xem chú thích của hàm.
  }
}

/**
 * Đọc nháp của mẫu này. Nội dung chữ trả về ngay; ảnh phải tải lại riêng bằng
 * `restoreDraftPhotos` vì đó là việc qua mạng.
 */
export function readDraft(templateSlug: string): StoredDraft | null {
  dropLegacyStore();

  let record: Partial<DraftRecord>;
  try {
    const raw = localStorage.getItem(key(templateSlug));
    if (!raw) return null;
    record = JSON.parse(raw) as Partial<DraftRecord>;
  } catch {
    return null;
  }
  if (!record.content || !record.savedAt) return null;
  if (Date.now() - record.savedAt > MAX_AGE_MS) {
    clearDraft(templateSlug);
    return null;
  }

  // Nháp định dạng cũ (cất lúc sang trang đăng nhập) không có bản đồ id: chữ
  // vẫn dùng được, ảnh thì báo mất.
  const session = record.session ?? null;
  const ids = session ? (record.photos ?? {}) : {};
  let photosLost = false;

  const slots: [string, string][] = [];
  const photos = Object.fromEntries(
    Object.entries(record.content.photos).flatMap(([slot, url]) => {
      if (!isBlobPhoto(url)) return [[slot, url] as const];
      const id = ids[url];
      if (id) slots.push([slot, id]);
      else photosLost = true;
      return [];
    }),
  );

  const album = record.content.album.photos.flatMap((url): AlbumEntry[] => {
    if (!isBlobPhoto(url)) return [{ url }];
    const id = ids[url];
    if (id) return [{ id }];
    photosLost = true;
    return [];
  });

  return {
    // Một URL `blob:` chết mà lọt tới lượt lưu sẽ được ghi thẳng vào database,
    // thành tấm thiệp vĩnh viễn trỏ vào bộ nhớ của một tab đã đóng — nên nội
    // dung trả ra không chứa tấm nào như vậy.
    content: {
      ...record.content,
      ...(record.content.sharePreview &&
      isBlobPhoto(record.content.sharePreview.photoUrl)
        ? { sharePreview: { ...record.content.sharePreview, photoUrl: "" } }
        : {}),
      photos,
      album: {
        ...record.content.album,
        photos: album.flatMap((entry) => ("url" in entry ? [entry.url] : [])),
      },
    },
    slots,
    album,
    session,
    photosLost,
    sharePhotoId: ids[record.content.sharePreview?.photoUrl ?? ""],
  };
}

/** Số ảnh của nháp phải tải lại từ vùng tạm. */
export function draftPhotoCount(draft: StoredDraft): number {
  return (
    draft.slots.length + draft.album.filter((entry) => "id" in entry).length
  );
}

/**
 * Tải lại bản đã nén của các ảnh trong nháp và cấp cho mỗi tấm một URL `blob:`
 * mới, **giữ nguyên id vùng tạm** — lúc Lưu, tấm đó được nhận thẳng về thiệp
 * mà không phải gửi lại.
 */
export async function restoreDraftPhotos(
  draft: StoredDraft,
  signal: AbortSignal,
  /**
   * Gọi mỗi khi thêm được một tấm, với **toàn bộ** những gì đã về tới lúc đó
   * (không phải phần chênh) — để editor gắn dần từng tấm thay vì bắt người
   * dùng nhìn ô trống cả phút chờ server nén xong tấm cuối.
   */
  onProgress?: (restored: RestoredPhotos) => void,
): Promise<RestoredPhotos> {
  const ids = [
    ...draft.slots.map(([, id]) => id),
    ...draft.album.flatMap((entry) => ("id" in entry ? [entry.id] : [])),
  ];
  const urls = new Map<string, string>();

  const snapshot = (): RestoredPhotos => ({
    sharePhotoUrl: draft.sharePhotoId
      ? urls.get(draft.sharePhotoId)
      : undefined,
    photos: Object.fromEntries(
      draft.slots.flatMap(([slot, id]) => {
        const url = urls.get(id);
        return url ? [[slot, url] as const] : [];
      }),
    ),
    album: draft.album.flatMap((entry) => {
      if ("url" in entry) return [entry.url];
      const url = urls.get(entry.id);
      return url ? [url] : [];
    }),
    lost: urls.size < new Set(ids).size,
  });

  if (draft.session && ids.length > 0) {
    const session = draft.session;
    const queue = [...new Set(ids)];
    await Promise.all(
      Array.from(
        { length: Math.min(RESTORE_CONCURRENCY, queue.length) },
        async () => {
          for (let id = queue.shift(); id; id = queue.shift()) {
            const url = await restoreOne(session, id, signal);
            if (!url || signal.aborted) continue;
            urls.set(id, url);
            onProgress?.(snapshot());
          }
        },
      ),
    );
  }

  return snapshot();
}

async function restoreOne(
  session: string,
  id: string,
  signal: AbortSignal,
): Promise<string | null> {
  const deadline = Date.now() + PROCESSING_MAX_WAIT_MS;
  let networkRetries = 2;

  while (!signal.aborted) {
    try {
      const blob = await fetchStagedPreview(session, id, signal);
      if (signal.aborted) return null;
      const url = await adoptPhoto(
        new File([blob], `${id}.avif`, { type: "image/avif" }),
        id,
      );
      // Người dùng đã rời đi trong lúc làm thumbnail: không ai nhận URL này.
      if (signal.aborted) {
        releasePhoto(url);
        return null;
      }
      return url;
    } catch (error) {
      if (signal.aborted || !(error instanceof ApiError)) return null;
      // Ảnh ẩn danh xếp cuối hàng đợi nén nên có thể chưa xong; mất mạng một
      // nhịp lúc vừa mở lại trang cũng thường gặp. Mọi mã khác (404, phiên
      // hết hạn) là ảnh đã mất thật.
      const retry =
        error.code === API_ERROR_CODES.stagedPhotoProcessing ||
        (error.status === 0 && networkRetries-- > 0);
      if (!retry || Date.now() > deadline) return null;
      await sleep(PROCESSING_RETRY_MS);
    }
  }
  return null;
}

export function clearDraft(templateSlug: string) {
  try {
    localStorage.removeItem(key(templateSlug));
  } catch {
    // Không có gì để làm; lần đọc sau vẫn tự bỏ qua nháp quá hạn.
  }
}

let legacyDropped = false;

/**
 * Xoá kho IndexedDB của định dạng nháp cũ — nó cất nguyên byte ảnh, và không
 * còn đường nào đọc tới nó nữa. Chạy một lần mỗi trang, hỏng thì bỏ qua.
 */
function dropLegacyStore() {
  if (legacyDropped) return;
  legacyDropped = true;
  try {
    indexedDB.deleteDatabase(LEGACY_DB_NAME);
  } catch {
    // IndexedDB bị chặn: vốn đã không có gì để xoá.
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
