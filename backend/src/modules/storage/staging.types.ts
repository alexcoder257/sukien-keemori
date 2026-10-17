/**
 * Vùng tạm của ảnh editor — **tách hẳn** kho công khai (`StorageProvider`).
 *
 * Ảnh người dùng vừa chọn được gửi lên đây ngay, kể cả khi họ chưa đăng nhập,
 * rồi mới được kiểm, nén và chép sang kho công khai lúc lưu thiệp (xem
 * `UploadStagingService`). Vùng này phải **riêng tư**: nó nhận tệp từ người
 * chưa đăng nhập, nên một URL công khai trỏ vào đây là biến dịch vụ thành chỗ
 * lưu file miễn phí cho bất kỳ ai. Trên R2 vì vậy nó là một **bucket riêng**
 * không gắn custom domain, không phải một tiền tố trong bucket công khai —
 * custom domain phục vụ mọi khoá trong bucket, không chặn được theo tiền tố.
 */

/** Chỗ trình duyệt gửi thẳng byte ảnh lên. */
export interface StagingUploadTarget {
  /**
   * URL tuyệt đối (presigned URL của R2) hoặc đường dẫn tương đối của backend
   * (driver `local`). Đường dẫn tương đối thì client gắn `API_BASE_URL` và
   * header phiên tải lên.
   */
  url: string;
  method: 'PUT';
  /** Header **bắt buộc** gửi kèm — R2 đưa `Content-Type` vào chữ ký. */
  headers: Record<string, string>;
}

export interface StagingStorage {
  createUploadTarget(input: {
    key: string;
    photoId: string;
    contentType: string;
  }): Promise<StagingUploadTarget>;
  /** Dung lượng của tệp đã tải lên, hoặc `null` nếu chưa có tệp nào. */
  size(key: string): Promise<number | null>;
  read(key: string): Promise<Buffer>;
  write(key: string, buffer: Buffer, contentType: string): Promise<void>;
  /** Idempotent: tệp không tồn tại không phải lỗi. */
  remove(key: string): Promise<void>;
  /** Xoá mọi khoá bắt đầu bằng `prefix`. Idempotent. */
  removePrefix(prefix: string): Promise<void>;
}

export const STAGING_STORAGE = Symbol('STAGING_STORAGE');

/**
 * Khoá trong vùng tạm. `raw/` là byte người dùng gửi, **chưa ai kiểm**; `ready/`
 * là bản AVIF đã giải mã và nén lại, chờ được nhận về một tấm thiệp. Cả hai đều
 * nằm dưới id phiên để dọn một phiên là xoá đúng hai tiền tố.
 */
export const stagingKeys = {
  raw: (sessionId: string, photoId: string) => `raw/${sessionId}/${photoId}`,
  ready: (sessionId: string, photoId: string) =>
    `ready/${sessionId}/${photoId}.avif`,
  sessionPrefixes: (sessionId: string) => [
    `raw/${sessionId}/`,
    `ready/${sessionId}/`,
  ],
};
