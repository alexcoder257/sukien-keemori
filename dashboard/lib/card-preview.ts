/**
 * Đường dẫn ảnh xem trước của một mẫu thiệp.
 *
 * Ảnh nằm trong `frontend/public/images/templates/<slug>/` — CMS thấy được nhờ
 * rewrite `/images/*` trong `next.config.ts`. Đường dẫn suy từ slug chứ không
 * lưu trong database vì quy ước "một mẫu = một thư mục" đã là luật của kho mẫu
 * (xem `CLAUDE.md`); thêm một cột nữa chỉ tạo chỗ cho hai giá trị lệch nhau.
 */

/** Ảnh bìa khổ đứng — dùng khi cần nhận ra thiệp trong một lưới. */
export function templatePosterSrc(templateSlug: string): string {
  return `/images/templates/${templateSlug}/poster.avif`;
}

/**
 * Ảnh bìa của một mẫu trong kho. `imageSrc` của mẫu là ảnh chụp dài
 * (`thumbnail.avif`); bìa nằm cạnh nó theo quy ước "một mẫu = một thư mục".
 */
export function templateCoverSrc(template: {
  slug: string;
  imageSrc: string | null;
}): string {
  return template.imageSrc
    ? template.imageSrc.replace(/\/thumbnail\.avif$/, "/poster.avif")
    : templatePosterSrc(template.slug);
}

/** Ảnh chụp dài toàn bộ thiệp — mặc định cho ô trong dải trang chủ. */
export function templateThumbnailSrc(templateSlug: string): string {
  return `/images/templates/${templateSlug}/thumbnail.avif`;
}

/**
 * Ảnh bìa của một ô trưng bày: ảnh khai riêng nếu có, không thì suy từ ảnh
 * chụp dài theo quy ước `thumbnail.avif` → `poster.avif` — cùng luật với
 * `templatePosterSrc` bên `frontend/lib/template-poster.ts`.
 */
export function showcasePosterSrc(item: {
  imageSrc: string;
  posterSrc: string | null;
}): string {
  if (item.posterSrc) return item.posterSrc;
  return item.imageSrc.replace(/\/thumbnail\.avif$/, "/poster.avif");
}

/**
 * Link đầy đủ của một thiệp trên trang khách, ví dụ
 * `https://keemori.com/vi/t/<slug>`. Gốc lấy từ `SITE_ORIGIN` (xem
 * `next.config.ts`).
 */
export function cardPublicUrl(slug: string, locale: string): string {
  const origin = (process.env.SITE_ORIGIN ?? "").replace(/\/+$/, "");
  return `${origin}/${locale}/t/${slug}`;
}
