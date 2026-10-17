/**
 * Đường dẫn `poster.avif` của một mẫu, suy từ `thumbnail.avif` nằm cạnh nó.
 *
 * `imageSrc` mà backend trả về là **ảnh chụp dài toàn bộ thiệp** (960 × ~14000
 * px) — đúng cho hiệu ứng pan khi hover, nhưng đặt vào một khung nhỏ với
 * `object-cover` thì chỉ còn khúc giữa của dải ảnh (thường là tấm lịch). Poster
 * là lát cắt đầu dải, tức màn bìa có tên cô dâu chú rể.
 *
 * Suy theo quy ước tên chứ không khai thêm cột: hai tệp luôn nằm cạnh nhau
 * (xem `frontend/CLAUDE.md` mục 2). Ảnh không theo quy ước đó (atlas cũ) thì
 * trả `undefined` để nơi gọi tự quyết định dùng ảnh gốc.
 */
export function templatePosterSrc(imageSrc?: string | null): string | undefined {
  if (!imageSrc || !/\/thumbnail\.avif$/.test(imageSrc)) return undefined;
  return imageSrc.replace(/\/thumbnail\.avif$/, "/poster.avif");
}
