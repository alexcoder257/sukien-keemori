/**
 * Bỏ `id` khỏi một bản ghi để lấy phần nội dung dùng làm bản nháp của form.
 *
 * Backend nhận DTO **không có `id`** — khoá nằm ở URL. Gửi kèm `id` trong body
 * thì `class-validator` với `forbidNonWhitelisted` sẽ từ chối cả request.
 */
export function withoutId<T extends { id: string }>(entity: T): Omit<T, "id"> {
  const copy: Record<string, unknown> = { ...entity };
  delete copy.id;
  return copy as Omit<T, "id">;
}
