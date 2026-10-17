/**
 * Hợp đồng lưu trữ tệp. Có interface này thì đổi từ đĩa local sang S3/R2 hay
 * Cloudinary chỉ là thêm một provider — `cards` và controller upload
 * không biết tệp nằm ở đâu.
 *
 * Thiệp là **link vĩnh viễn**, nên tệp đã lưu là chi phí vĩnh viễn: mọi provider
 * đều phải trả về một URL ổn định, không phải URL ký hạn ngắn.
 */
export interface StoredFile {
  /** URL công khai để nhét thẳng vào `content.photos` hoặc `content.album`. */
  url: string;
  /** Khoá nội bộ để xoá về sau; với đĩa local là đường dẫn tương đối. */
  key: string;
  size: number;
  mimeType: string;
}

export interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  /** Thư mục logic, ví dụ `cards/<cardId>/album`. */
  folder: string;
}

export interface StorageProvider {
  save(input: UploadFileInput): Promise<StoredFile>;
  /** Đọc ảnh đã lưu bằng khoá nội bộ; bên gọi phải kiểm quyền sở hữu trước. */
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
  /**
   * Xoá **cả thư mục logic** — dùng khi một tấm thiệp bị xoá: mọi ảnh của nó
   * nằm dưới `cards/<cardId>`, và đó là đường duy nhất tìm lại được chúng.
   * Suy khoá ngược từ URL trong `content` thì ảnh đã bị người dùng gỡ khỏi ô
   * trước lúc xoá thiệp sẽ ở lại đĩa vĩnh viễn.
   *
   * Phải **idempotent**: thư mục không tồn tại không phải lỗi.
   */
  removeFolder(folder: string): Promise<void>;
  /**
   * Suy ngược khoá từ URL công khai đã ghi trong `content`, hoặc `null` nếu URL
   * không phải của provider này (ảnh mẫu `/images/...`, URL lạ).
   *
   * Dùng khi lưu thiệp: ảnh có trong bản cũ mà không còn trong bản mới là ảnh
   * đã bị thay, và đây là lúc duy nhất còn biết nó từng thuộc thiệp nào. Bên
   * gọi **bắt buộc** kiểm khoá bằng `isKeyInsideCard` trước khi xoá.
   */
  keyFromUrl(url: string): string | null;
}

/** Token DI cho provider đang bật — xem `StorageModule`. */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
