/**
 * Thu nhỏ ảnh **trong trình duyệt** trước khi gửi lên.
 *
 * Ảnh gốc từ điện thoại nặng 3–15MB, trong khi bản server giữ lại chỉ cần cạnh
 * dài 2048px. Gửi nguyên ảnh gốc là bắt khách mời chờ upload gấp 5–10 lần cho
 * byte sẽ bị cắt bỏ ngay ở server. Bản thu nhỏ còn khoảng 0,4–0,8MB.
 *
 * Đây **không** thay bước nén ở server (`ImageProcessorService`): server vẫn
 * giải mã và nén lại mọi tệp, vì client không ép được — người gọi thẳng API vẫn
 * phải qua bước đó, và bước giải mã còn là lớp kiểm tra tệp có thật là ảnh.
 * Bản JPEG ở đây chỉ để **đi đường**, không được lưu lại.
 *
 * Mọi lỗi đều rơi về gửi nguyên ảnh gốc: trình duyệt cũ không thu nhỏ được
 * không phải lý do để chặn khách tải ảnh.
 */

/**
 * Cạnh dài tối đa — **bản sao có chủ đích** của `MAX_PHOTO_DIMENSION` ở
 * `backend/src/modules/storage/image-processor.service.ts`. Hai bên phải bằng
 * nhau: nhỏ hơn thì mất chi tiết không lấy lại được, lớn hơn thì gửi byte để
 * rồi bị cắt.
 */
export const MAX_PHOTO_DIMENSION = 2048;

/**
 * Quality của bản đi đường. Server sẽ nén lại lần nữa (AVIF q70), nên bản này
 * phải đủ sạch để lần nén thứ hai không cộng dồn lỗi — vỡ khối 8×8 của JPEG
 * chất lượng thấp là nhiễu mà bộ nén AVIF phía sau không phân biệt được với
 * chi tiết thật.
 */
const JPEG_QUALITY = 0.85;

/**
 * Ảnh đã đủ nhỏ cả về cạnh lẫn dung lượng thì gửi nguyên: mã hoá lại chỉ tốn
 * CPU điện thoại và thêm một lần mất dữ liệu.
 */
const PASSTHROUGH_BYTES = 1.5 * 1024 * 1024;

type Canvas2D = OffscreenCanvas | HTMLCanvasElement;

function createCanvas(width: number, height: number): Canvas2D {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function encodeJpeg(canvas: Canvas2D, quality: number): Promise<Blob | null> {
  // **JPEG, không WebP**: canvas của Safari không mã hoá được WebP mà âm thầm
  // trả về PNG — nặng gấp mấy lần ảnh gốc.
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  }
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
}

/**
 * Giải mã theo đúng chiều EXIF. Mọi trình duyệt hiện đại đã mặc định như vậy,
 * nhưng khai rõ vẫn rẻ hơn một tấm ảnh cô dâu nằm ngang; trình duyệt không
 * nhận tuỳ chọn này thì thử lại không kèm.
 */
async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(file);
  }
}

function jpegName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "") || "photo";
  return `${base}.jpg`;
}

/**
 * Tệp đã đi qua bước thu nhỏ. Ảnh được thu nhỏ ngay lúc chọn (để preview
 * không vẽ ảnh gốc) rồi lại đi qua `prepareUploadFile` lúc gửi; không nhớ thì
 * mỗi tấm bị giải mã thêm một lần chỉ để kết luận "đã đủ nhỏ".
 */
const preparedFiles = new WeakSet<File>();

function prepared(file: File): File {
  preparedFiles.add(file);
  return file;
}

/**
 * Trả bộ nhớ của canvas ngay. Safari iOS giữ bộ nhớ canvas tới lúc GC chạy và
 * có trần tổng cho mọi canvas của trang; thu nhỏ liền vài chục ảnh là chạm trần
 * trước khi GC kịp dọn. Đặt cạnh về 0 là cách duy nhất ép nó nhả.
 */
function releaseCanvas(canvas: Canvas2D) {
  canvas.width = 0;
  canvas.height = 0;
}

/** Vẽ `bitmap` theo `scale` lên một canvas mới rồi mã hoá JPEG. */
async function renderJpeg(
  bitmap: ImageBitmap,
  scale: number,
  quality: number,
): Promise<Blob | null> {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = createCanvas(width, height);
  try {
    const context = canvas.getContext("2d") as
      OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    if (!context) return null;

    // JPEG không có kênh trong suốt: nền trắng để PNG trong suốt không hoá đen.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await encodeJpeg(canvas, quality);
    return blob && blob.size > 0 ? blob : null;
  } finally {
    releaseCanvas(canvas);
  }
}

/** Bản đi đường của `file`, từ bitmap đã giải mã sẵn. */
async function uploadVersion(file: File, bitmap: ImageBitmap): Promise<File> {
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= MAX_PHOTO_DIMENSION && file.size <= PASSTHROUGH_BYTES) {
    return prepared(file);
  }

  const scale = Math.min(1, MAX_PHOTO_DIMENSION / longest);
  const blob = await renderJpeg(bitmap, scale, JPEG_QUALITY);
  if (!blob) return prepared(file);
  // Ảnh vốn đã nhỏ về cạnh mà bản nén lại còn nặng hơn: giữ bản gốc.
  if (scale === 1 && blob.size >= file.size) return prepared(file);

  return prepared(
    new File([blob], jpegName(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    }),
  );
}

/**
 * Cạnh **ngắn** của bản thumbnail. Ô ảnh trong editor rộng nhiều nhất ~150px
 * CSS, nhân mật độ điểm ảnh 3 của iPhone là ~450px; ô vuông `object-cover` cắt
 * theo cạnh ngắn, nên đo cạnh ngắn mới giữ ô nét.
 */
const THUMBNAIL_SHORT_SIDE = 480;
const THUMBNAIL_QUALITY = 0.8;

/**
 * Bản chỉ để **vẽ** trong ô ảnh của editor, không bao giờ gửi lên. `null` khi
 * ảnh vốn đã nhỏ cỡ đó — ô dùng thẳng bản chính.
 */
async function thumbnailVersion(bitmap: ImageBitmap): Promise<Blob | null> {
  const shortest = Math.min(bitmap.width, bitmap.height);
  const scale = THUMBNAIL_SHORT_SIDE / shortest;
  if (scale >= 1) return null;
  return renderJpeg(bitmap, scale, THUMBNAIL_QUALITY);
}

export type PreparedPhoto = {
  /** Bản gửi lên, xem `prepareUploadFile`. */
  file: File;
  /** Bản cho ô ảnh trong editor, `null` nếu không cần hoặc không làm được. */
  thumbnail: Blob | null;
};

/**
 * Bản gửi lên **và** bản thumbnail, từ đúng **một** lần giải mã — giải mã ảnh
 * gốc là bước tốn bộ nhớ nhất, không làm hai lần cho cùng một tấm.
 *
 * `resize: false` giữ nguyên `file` và chỉ làm thumbnail: ảnh khôi phục từ nháp
 * đã là bản server nén rồi, mã hoá lại chỉ tốn thêm một lần mất dữ liệu.
 *
 * Mọi lỗi đều rơi về `file` và không có thumbnail: trình duyệt cũ không thu nhỏ
 * được không phải lý do để chặn khách tải ảnh.
 */
export async function preparePhoto(
  file: File,
  { resize = true }: { resize?: boolean } = {},
): Promise<PreparedPhoto> {
  if (typeof createImageBitmap === "undefined") {
    return { file: prepared(file), thumbnail: null };
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await decode(file);
    const upload = resize ? await uploadVersion(file, bitmap) : prepared(file);
    const thumbnail = await thumbnailVersion(bitmap).catch(() => null);
    return { file: upload, thumbnail };
  } catch {
    return { file: prepared(file), thumbnail: null };
  } finally {
    bitmap?.close();
  }
}

/**
 * Trả về tệp để gửi lên: bản thu nhỏ nếu đáng, còn lại là chính `file`.
 * `file.type` phải là một trong các định dạng server nhận — xem
 * `normalizePhotoFile` ở `lib/album-uploads.ts`.
 */
export async function prepareUploadFile(file: File): Promise<File> {
  if (preparedFiles.has(file)) return file;
  if (typeof createImageBitmap === "undefined") return prepared(file);

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await decode(file);
    return await uploadVersion(file, bitmap);
  } catch {
    return prepared(file);
  } finally {
    bitmap?.close();
  }
}
