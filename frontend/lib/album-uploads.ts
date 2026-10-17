/**
 * Kho ảnh của editor: file người dùng vừa chọn, trạng thái gửi lên vùng tạm của
 * từng tấm, và tấm nào đã nằm trong vùng tạm dưới id nào.
 *
 * Ảnh được gửi lên **vùng tạm ngay lúc chọn**, kể cả khi chưa đăng nhập, và chỉ
 * thành ảnh của thiệp lúc bấm Lưu (xem `lib/photo-staging.ts`). Form vẫn chỉ
 * giữ chuỗi URL nên schema không đổi: `blob:` cho tới lúc lưu, đường dẫn thật
 * (`/uploads/...`) sau khi server nhận ảnh về thiệp.
 *
 * Đây là module-level state chứ không phải state của React, vì cùng một tấm
 * ảnh được nhìn từ hai nơi (ô ảnh trong form và khung xem thử) và còn phải
 * sống sót qua một vòng `form.reset` khi khôi phục bản nháp. Component đọc nó
 * qua `subscribePhotos` + `useSyncExternalStore`.
 */

import { preparePhoto } from "@/lib/image-resize";

/**
 * File sẽ gửi lên, khoá theo URL `blob:` của tấm ảnh. Ảnh chọn mới đã được thu
 * nhỏ (`lib/image-resize.ts`) trước khi có URL, nên URL preview và thứ đi
 * đường là cùng một bản nhẹ.
 */
const pendingFiles = new Map<string, File>();

/**
 * URL `blob:` của bản thumbnail (~480px), khoá theo URL chính của tấm ảnh. Chỉ
 * ô ảnh trong editor vẽ nó, qua `photoThumbnail`.
 *
 * Lý do tồn tại: trình duyệt giải mã ảnh ở độ phân giải của **tệp**, không phải
 * của khung vẽ. Lưới album 30 ô vẽ thẳng bản 2048px là ~380MB bộ nhớ cho 30
 * hình to bằng đầu ngón tay — đủ để iOS giết trình duyệt trong app Messenger
 * trên máy đời cũ. Bản thumbnail đưa con số đó về ~20MB. Khung xem thử vẫn vẽ
 * bản chính, vì đó là cỡ khách mời thật sự nhìn thấy.
 */
const thumbnails = new Map<string, string>();

/**
 * URL để vẽ trong ô ảnh của editor: thumbnail nếu có, còn lại chính `url` —
 * ảnh của thiệp đã lưu từ phiên trước và ảnh không làm được thumbnail.
 *
 * Ảnh vừa được nhận về thiệp trong phiên này thì form đã đổi sang URL thật,
 * nên tra thêm qua URL `blob:` cũ của nó; không vậy thì bấm Lưu xong là cả
 * lưới album tải lại bản 2048px từ server.
 *
 * Tra bảng thuần, không cần đăng ký theo dõi: thumbnail luôn được tạo **trước**
 * khi URL chính vào form (`preparePhotos`, `adoptPhoto`).
 */
export function photoThumbnail(url: string): string {
  const pending = pendingOfUploaded.get(url);
  return (
    thumbnails.get(url) ?? (pending ? thumbnails.get(pending) : undefined) ?? url
  );
}

/** Cấp URL `blob:` cho một tấm vừa chuẩn bị xong và ghi nó vào kho. */
function registerPhoto(
  file: File,
  thumbnail: Blob | null,
  fingerprint: string,
): string {
  const url = URL.createObjectURL(file);
  pendingFiles.set(url, file);
  fingerprints.set(url, fingerprint);
  if (thumbnail) thumbnails.set(url, URL.createObjectURL(thumbnail));
  return url;
}

/**
 * Dấu vân tay của **ảnh gốc** lúc chọn, khoá theo URL. Tách khỏi `pendingFiles`
 * vì bản thu nhỏ đổi tên và dung lượng: so trên nó thì chọn lại đúng tấm vừa
 * chọn sẽ không bị nhận ra là trùng.
 */
const fingerprints = new Map<string, string>();

/**
 * Phải khớp `ALLOWED_MIME_TYPES` của `backend/src/modules/storage/storage.constants.ts`
 * — đây là bản sao có chủ đích, sửa một bên thì sửa nốt bên kia. HEIC **không**
 * nằm trong danh sách: `sharp` dựng sẵn không giải mã được HEIF, nên nhận ở
 * client chỉ đổi một lời từ chối ngay lúc chọn thành một lỗi sau khi người
 * dùng đã ngồi đợi upload. iOS tự chuyển ảnh sang JPEG khi gửi qua `<input
 * type="file">`, nên bỏ nó ra không mất tấm ảnh nào.
 */
export const ACCEPTED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AcceptedPhotoType = (typeof ACCEPTED_PHOTO_TYPES)[number];

/**
 * Tên gọi khác của JPEG mà vài máy Windows báo ra, và đuôi tệp để đoán định
 * dạng khi trình duyệt báo `file.type` rỗng (trình chọn tệp của vài máy
 * Android, tệp lấy từ Google Drive hay Zalo). Chỉ là **đoán để khỏi từ chối
 * nhầm** — server vẫn giải mã từng tệp, đoán sai thì bị chặn ở đó.
 */
const MIME_ALIASES: Record<string, AcceptedPhotoType> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
};
const EXTENSION_TYPES: Record<string, AcceptedPhotoType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

function photoType(file: File): AcceptedPhotoType | null {
  if ((ACCEPTED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return file.type as AcceptedPhotoType;
  }
  const alias = MIME_ALIASES[file.type];
  if (alias) return alias;
  if (file.type !== "") return null;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? null;
}

/**
 * Chuẩn hoá `file.type` về đúng tên server nhận. `new File([file])` không chép
 * byte — nó chỉ bọc lại cùng một vùng dữ liệu với nhãn mới.
 */
function normalizePhotoFile(file: File, type: AcceptedPhotoType): File {
  if (file.type === type) return file;
  return new File([file], file.name, {
    type,
    lastModified: file.lastModified,
  });
}

/**
 * Client **không** chặn theo dung lượng: trình duyệt thu nhỏ ảnh trước khi gửi
 * và server nén lại mọi ảnh, nên tệp gốc 4MB hay 20MB đều ra cùng một cỡ khi
 * nằm xuống đĩa. Trần duy nhất còn lại là `MAX_UPLOAD_BYTES` bên backend.
 */
export type PhotoRejection = "type" | "limit" | "duplicate";

/** Một ảnh đã qua vòng lọc, chưa thu nhỏ và chưa có URL preview. */
export type PickedPhoto = { file: File; fingerprint: string };

export type PickPhotosResult = {
  /** Ảnh hợp lệ, theo đúng thứ tự người dùng chọn. */
  accepted: PickedPhoto[];
  /** Lý do của từng ảnh bị loại, để hiển thị một thông báo gộp. */
  rejections: PhotoRejection[];
};

/**
 * Dấu vân tay của những ảnh đã chọn nhưng **đang thu nhỏ** — chưa có URL nên
 * chưa nằm trong form. Không có nó thì chọn lại cùng tấm trong vài giây đó sẽ
 * lọt qua bước lọc trùng.
 */
const preparing = new Set<string>();

/** Số ảnh đang thu nhỏ, để trừ vào số chỗ còn trống của album. */
export function preparingCount(): number {
  return preparing.size;
}

const preparedWaiters = new Set<() => void>();

/**
 * Đợi mọi ảnh đang thu nhỏ vào xong form. Trước vòng đăng nhập phải đợi cả bước
 * này chứ không chỉ bước gửi lên: tấm còn đang thu nhỏ chưa có trong form, nên
 * nháp không biết tới nó và nó mất sau khi quay về.
 */
export function waitForPreparedPhotos(): Promise<void> {
  if (preparing.size === 0) return Promise.resolve();
  return new Promise((resolve) => preparedWaiters.add(resolve));
}

function notifyPrepared() {
  if (preparing.size > 0) return;
  for (const resolve of preparedWaiters) resolve();
  preparedWaiters.clear();
}

/**
 * Dấu vân tay đủ ổn định để nhận ra cùng một file được chọn lại trong phiên
 * editor mà không phải đọc/hash toàn bộ ảnh lớn trên main thread.
 */
function fileFingerprint(file: File): string {
  return [file.name, file.type, file.size, file.lastModified].join(":");
}

/**
 * Lọc danh sách file người dùng chọn theo định dạng, trùng lặp và số chỗ trống
 * còn lại. Chưa tạo URL nào — việc đó chờ bước thu nhỏ ở `preparePhotos`.
 */
export function pickPhotos(
  files: File[],
  slotsLeft: number,
  existingUrls: string[] = [],
): PickPhotosResult {
  const accepted: PickedPhoto[] = [];
  const rejections: PhotoRejection[] = [];
  const seen = new Set([
    ...preparing,
    ...existingUrls.flatMap((url) => {
      const fingerprint =
        fingerprints.get(url) ?? uploadedFingerprints.get(url);
      return fingerprint ? [fingerprint] : [];
    }),
  ]);

  for (const picked of files) {
    const type = photoType(picked);
    if (!type) {
      rejections.push("type");
      continue;
    }
    const fingerprint = fileFingerprint(picked);
    if (seen.has(fingerprint)) {
      rejections.push("duplicate");
      continue;
    }
    if (accepted.length >= slotsLeft) {
      rejections.push("limit");
      continue;
    }

    seen.add(fingerprint);
    preparing.add(fingerprint);
    accepted.push({ file: normalizePhotoFile(picked, type), fingerprint });
  }

  return { accepted, rejections };
}

/**
 * Thu nhỏ **từng tấm một** rồi mới cấp URL preview, và báo từng tấm ngay khi
 * xong để form thêm dần.
 *
 * URL preview phải trỏ vào **bản đã thu nhỏ**, không phải ảnh gốc: ô ảnh, lưới
 * album và khung xem thử đều vẽ thẳng URL đó, và trình duyệt giải mã ảnh ở độ
 * phân giải gốc bất kể khung vẽ nhỏ cỡ nào. Một ảnh 12MP giải mã ra ~48MB, ảnh
 * 48MP ~190MB; trước đây chọn 17 ảnh là trình duyệt trong app Messenger trên
 * iOS bị hệ điều hành giết (màn trắng), và mọi tấm chưa kịp lên vùng tạm mất
 * theo. Bản 2048px chỉ còn ~12MB mỗi tấm.
 *
 * Thu nhỏ tuần tự vì giải mã song song vài ảnh lớn là cách nhanh nhất để làm
 * đúng điều trên.
 */
export async function preparePhotos(
  picked: PickedPhoto[],
  onReady: (url: string) => void,
): Promise<void> {
  for (const { file, fingerprint } of picked) {
    try {
      const prepared = await preparePhoto(file);
      onReady(registerPhoto(prepared.file, prepared.thumbnail, fingerprint));
    } finally {
      preparing.delete(fingerprint);
      notifyPrepared();
    }
  }
}

/**
 * Nhận lại một ảnh của bản nháp — bản đã nén tải về từ vùng tạm — và cấp cho
 * nó URL preview mới.
 *
 * Dùng khi mở lại editor sau khi trang mất (vòng đăng nhập, F5, hay trình
 * duyệt trong app bị iOS giết): `pendingFiles` là bộ nhớ của *một* document,
 * URL `blob:` cũ chết theo, vì vậy phải cấp URL mới.
 *
 * `stagedId` là id của tấm này trong vùng tạm — có nó thì lúc Lưu tấm đó được
 * nhận thẳng về thiệp, **không phải gửi lại**. File vẫn được giữ để gửi lại
 * nếu phiên cũ đã hết hạn tới lúc đó.
 *
 * Tệp giữ nguyên (đã là bản server nén), chỉ làm thêm thumbnail: nháp của một
 * album 30 tấm khôi phục về cũng phải nhẹ như lúc chọn.
 */
export async function adoptPhoto(
  file: File,
  stagedId?: string,
): Promise<string> {
  const { thumbnail } = await preparePhoto(file, { resize: false });
  const url = registerPhoto(file, thumbnail, fileFingerprint(file));
  if (stagedId) staged.set(url, stagedId);
  return url;
}

/** Thay file sẽ gửi bằng bản đã thu nhỏ; URL preview giữ nguyên. */
export function replacePendingFile(url: string, file: File) {
  if (pendingFiles.has(url)) pendingFiles.set(url, file);
}

/**
 * Bỏ một ảnh khỏi kho và thu hồi URL preview để không rò bộ nhớ.
 *
 * Tấm đang tải dở bị **huỷ giữa chừng**: người dùng đã gỡ nó khỏi ô rồi, gửi
 * nốt vài MB nữa chỉ để xoá ngay sau đó là phí băng thông của họ.
 */
export function releasePhoto(url: string) {
  uploads.get(url)?.controller?.abort();
  uploads.delete(url);
  uploadedFingerprints.delete(url);
  emit();

  // Gỡ một ảnh đã lên server: URL `blob:` gốc của nó cũng phải được thu hồi,
  // form không còn chỗ nào giữ chuỗi đó nữa.
  const pending = pendingOfUploaded.get(url);
  if (pending) {
    pendingOfUploaded.delete(url);
    releasePending(pending);
    return;
  }

  releasePending(url);
}

function releasePending(url: string) {
  const stored = uploadedUrls.get(url);
  if (stored) {
    uploadedUrls.delete(url);
    pendingOfUploaded.delete(stored);
    uploadedFingerprints.delete(stored);
  }
  staged.delete(url);
  fingerprints.delete(url);
  const thumbnail = thumbnails.get(url);
  if (thumbnail) {
    thumbnails.delete(url);
    URL.revokeObjectURL(thumbnail);
  }
  if (!pendingFiles.delete(url)) return;
  URL.revokeObjectURL(url);
}

/**
 * Ảnh chưa lưu nằm ở `blob:` nên bộ tối ưu ảnh của Next không với tới —
 * template phải tự tắt tối ưu cho đúng những tấm đó. Kiểm theo dạng URL chứ
 * không tra `pendingFiles`: template còn được dựng phía server, nơi không có
 * bản đồ ảnh chờ upload nào cả.
 */
export function isBlobPhoto(url?: string) {
  return Boolean(url?.startsWith("blob:"));
}

/**
 * URL thật của những ảnh đã được nhận về thiệp trong phiên editor này, khoá
 * theo URL `blob:` cũ.
 *
 * Cần bản đồ này vì lưu thiệp có thể hỏng **sau** khi vài ảnh đã được nhận về
 * (mất mạng giữa chừng): form vẫn giữ `blob:`, nên lần bấm lưu tiếp theo phải
 * biết tấm nào đã xong để không nhận lại.
 */
const uploadedUrls = new Map<string, string>();

/**
 * Dấu vân tay của những ảnh đã thành ảnh thật, khoá theo **URL thật** — để
 * `pickPhotos` vẫn nhận ra ảnh trùng khi form đã đổi sang URL thật.
 */
const uploadedFingerprints = new Map<string, string>();

/**
 * URL `blob:` cũ của một ảnh đã thành ảnh thật. Không có bản đồ ngược này thì
 * gỡ ảnh ra khỏi ô sẽ để lại chính tấm ảnh gốc nằm trong bộ nhớ trình duyệt
 * cho tới lúc rời trang.
 */
const pendingOfUploaded = new Map<string, string>();

/**
 * File còn chờ, hoặc `undefined` nếu ảnh này đã thành ảnh thật — kể cả khi form
 * vẫn đang giữ URL `blob:` của nó.
 */
export function pendingPhotoFile(url: string): File | undefined {
  if (uploadedUrls.has(url)) return undefined;
  return pendingFiles.get(url);
}

/** URL để ghi vào `content`: URL thật nếu đã nhận về thiệp, còn lại giữ nguyên. */
export function resolvePhotoUrl(url: string): string {
  return uploadedUrls.get(url) ?? url;
}

/**
 * Đánh dấu một ảnh chờ đã thành ảnh thật của thiệp. Không thu hồi URL `blob:`
 * ở đây: người dùng vẫn đang nhìn tấm ảnh đó cho tới lúc rời trang.
 */
export function markPhotoUploaded(pendingUrl: string, uploadedUrl: string) {
  uploadedUrls.set(pendingUrl, uploadedUrl);
  pendingOfUploaded.set(uploadedUrl, pendingUrl);
  const fingerprint = fingerprints.get(pendingUrl);
  if (fingerprint) uploadedFingerprints.set(uploadedUrl, fingerprint);
}

/* ------------------------------------------------------------------ *
 * Vùng tạm
 * ------------------------------------------------------------------ */

/**
 * Id trong vùng tạm của những tấm đã gửi xong byte, khoá theo URL `blob:`.
 * Lúc Lưu, đây là thứ được đem đi "nhận về thiệp".
 */
const staged = new Map<string, string>();

export function stagedPhotoId(url: string): string | undefined {
  return staged.get(url);
}

export function setStagedPhotoId(url: string, id: string) {
  staged.set(url, id);
}

export function clearStagedPhotoId(url: string) {
  staged.delete(url);
}

/**
 * Lưu thiệp xong: mọi tấm đã thuộc thiệp, gỡ chúng khỏi ô từ giờ không được
 * xoá trong vùng tạm nữa — việc dọn ảnh bị thay do backend làm lúc lưu.
 */
export function forgetStagedPhotos() {
  staged.clear();
}

/* ------------------------------------------------------------------ *
 * Trạng thái gửi lên
 * ------------------------------------------------------------------ */

export type PhotoUploadStatus = "uploading" | "failed";

export type PhotoUpload = {
  status: PhotoUploadStatus;
  /** 0 → 1. Chỉ có nghĩa khi `status === "uploading"`. */
  progress: number;
  controller?: AbortController;
};

/**
 * Khoá theo URL `blob:`. Tấm gửi xong thì mục này biến mất — ô ảnh không còn
 * lớp phủ, dù ảnh chỉ thành ảnh thật của thiệp lúc bấm Lưu.
 */
const uploads = new Map<string, PhotoUpload>();

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribePhotos(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function photoUpload(url: string): PhotoUpload | undefined {
  return uploads.get(url);
}

/**
 * Ảnh của bản nháp **chưa tải lại xong**: ô ảnh nào còn chờ và album còn thiếu
 * bao nhiêu tấm. Editor vẽ mỗi tấm thành một ô đang tải ngay từ đầu, để người
 * dùng thấy đủ số ảnh mình đã chọn thay vì một lưới vơi đi rồi đầy dần — trông
 * như mất ảnh, và họ đi chọn lại.
 */
export type RestoringPhotos = {
  slots: ReadonlySet<string>;
  album: number;
};

const NOT_RESTORING: RestoringPhotos = { slots: new Set(), album: 0 };
let restoring = NOT_RESTORING;

export function restoringPhotos(): RestoringPhotos {
  return restoring;
}

/** `null` khi đã khôi phục xong (hoặc bị huỷ). */
export function setRestoringPhotos(next: RestoringPhotos | null) {
  restoring = next ?? NOT_RESTORING;
  emit();
}

/** Mở một lượt tải lên; trả về tín hiệu huỷ để bên gọi truyền xuống API. */
export function beginUpload(url: string): AbortSignal {
  const controller = new AbortController();
  uploads.set(url, { status: "uploading", progress: 0, controller });
  emit();
  return controller.signal;
}

export function setUploadProgress(url: string, progress: number) {
  const current = uploads.get(url);
  if (!current || current.status !== "uploading") return;
  uploads.set(url, { ...current, progress });
  emit();
}

/** Byte đã tới vùng tạm và server đã nhận tấm này vào hàng đợi. */
export function finishUpload(url: string, stagedId: string) {
  staged.set(url, stagedId);
  uploads.delete(url);
  emit();
}

/**
 * Tải lên hỏng. Ảnh **ở lại** dưới dạng `blob:` chứ không bị gỡ khỏi form:
 * lượt Lưu sẽ gửi lại nó, nên hỏng mạng một lúc không có nghĩa là người dùng
 * phải đi chọn lại ảnh.
 */
export function failUpload(url: string) {
  if (!uploads.has(url)) return;
  uploads.set(url, { status: "failed", progress: 0 });
  emit();
}

/** Có đang tải tấm này không — dùng để không gửi trùng một tấm hai lần. */
export function isUploading(url: string): boolean {
  return uploads.get(url)?.status === "uploading";
}

/** Ảnh đang tải dở — dùng để chặn lưu thiệp giữa chừng. */
export function hasUploadsInFlight(urls: string[]): boolean {
  return urls.some((url) => uploads.get(url)?.status === "uploading");
}
