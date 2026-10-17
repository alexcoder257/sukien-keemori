/**
 * Định dạng chấp nhận. Ngân sách ảnh của dự án là ~200KB/màn ở AVIF/WebP
 * (`docs/business-model.md` mục 9) nên hai định dạng đó đứng đầu danh sách;
 * JPEG/PNG vẫn nhận vì máy ảnh và điện thoại xuất ra chúng.
 *
 * Bản sao có chủ đích ở `frontend/lib/album-uploads.ts` (`ACCEPTED_PHOTO_TYPES`).
 */
export const ALLOWED_MIME_TYPES = [
  'image/webp',
  'image/avif',
  'image/jpeg',
  'image/png',
];

/**
 * Trần dung lượng mỗi tệp gửi lên, **bằng đúng `client_max_body_size 20m`** của
 * Nginx trên VPS. Từng là 25MB, và khoảng 20–25MB khi đó là vùng chết: Nginx
 * chặn bằng một trang 413 HTML trước khi request tới backend, nên người dùng
 * chỉ thấy câu lỗi chung mà không biết vì sao.
 *
 * Con số nói về **RAM** chứ không phải dung lượng lưu trữ — `ImageProcessorService`
 * nén lại mọi ảnh nên tệp gốc to hay nhỏ đều ra cùng một cỡ. Ảnh từ editor
 * thường chỉ vài trăm KB vì trình duyệt đã thu nhỏ trước khi gửi
 * (`frontend/lib/image-resize.ts`); trần này dành cho nhánh dự phòng gửi
 * nguyên ảnh gốc khi trình duyệt không thu nhỏ được.
 */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Presigned URL sống vừa đủ cho một ảnh trên 3G, không đủ để đem đi chia sẻ. */
export const UPLOAD_URL_TTL_SECONDS = 10 * 60;

/**
 * Phiên tải lên sống một ngày — cùng tuổi với bản nháp của editor
 * (`frontend/lib/editor-draft.ts`) và với lifecycle rule của bucket tạm.
 */
export const UPLOAD_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Trần số ảnh của một phiên, tính **mọi tấm từng gửi** — kể cả tấm đã gỡ, tấm
 * hỏng và tấm đã lưu vào thiệp — nên con số chỉ tăng trong suốt 24 giờ phiên
 * sống. Một thiệp cần tối đa 6 ô + 30 ảnh album. Từng đặt 80: một người thay
 * ảnh vài lần, hoặc làm thiệp thứ hai trong ngày, là chạm trần, và từ đó mọi
 * ảnh mới đều hỏng mà không có đường ra ngoài đợi phiên hết hạn. 200 vẫn chặn
 * được một phiên ẩn danh dùng làm kho chứa: ảnh tạm không có URL công khai và
 * bị cron `upload-staging-purge` xoá sau một ngày.
 */
export const MAX_PHOTOS_PER_SESSION = 200;

/** Số ảnh tối đa trong một lượt xin URL hoặc báo xong. */
export const MAX_PHOTOS_PER_BATCH = 40;

/**
 * Thứ tự trong hàng đợi nén. Ảnh của thiệp đang được lưu đi trước hết — người
 * dùng đang ngồi nhìn nút "Đang lưu"; rồi tới ảnh của người đã đăng nhập; ảnh
 * ẩn danh đi sau cùng. Bị spam thì chỉ hàng ẩn danh chậm lại.
 */
export const STAGED_PRIORITY = {
  anonymous: 0,
  signedIn: 10,
  claiming: 100,
} as const;

/**
 * Tấm đang `processing` quá lâu nghĩa là worker chết giữa chừng (bị hệ điều
 * hành giết vì hết RAM, deploy) — trả nó về hàng đợi.
 */
export const STALE_PROCESSING_MS = 5 * 60 * 1000;

/** Nén hỏng quá số lần này thì bỏ, không lặp vô hạn trên một tệp độc. */
export const MAX_PROCESS_ATTEMPTS = 3;
