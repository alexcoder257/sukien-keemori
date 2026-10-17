/**
 * Ảnh mẫu đi kèm một mẫu thiệp (`public/images/templates/<slug>/photos/…`).
 *
 * Nút "Điền dữ liệu mẫu" của mẫu có nội dung trưng bày riêng đổ chính những ảnh
 * này vào ô ảnh. Để nguyên đường dẫn tĩnh thì thiệp chạy được, nhưng ảnh đó
 * **không phải ảnh của thiệp**: backend chỉ dựng ảnh chia sẻ, dọn ảnh bị thay…
 * từ ảnh nằm trong kho của chính thiệp (`cards/<id>/…`). Vì vậy editor tải nó
 * lên như một ảnh khách tự chọn — xem `adoptTemplatePhotos` trong
 * `invitation-editor.tsx`.
 */
const TEMPLATE_SAMPLE_PHOTO = /^\/images\/templates\/[^/]+\/photos\/[^/]+$/;

export function isTemplateSamplePhoto(url: string | undefined): url is string {
  return !!url && TEMPLATE_SAMPLE_PHOTO.test(url);
}

/** Tải ảnh mẫu về thành `File` để đi đúng luồng chọn ảnh; hỏng thì `null`. */
export async function fetchTemplateSamplePhoto(
  url: string,
): Promise<File | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const name = url.split("/").pop() ?? "photo.jpg";
    return new File([blob], name, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch {
    return null;
  }
}
