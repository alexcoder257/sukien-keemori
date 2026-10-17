import type { Dictionary } from "@/i18n/dictionaries";

/** Phần chữ giới thiệu riêng của một mẫu trên trang `/mau-thiep/<slug>`. */
export type TemplatePageCopy = {
  /**
   * Thẻ `<title>` riêng của mẫu, dạng "tên + đặc điểm" thay vì chỉ có tên.
   *
   * Không bắt buộc: mẫu chưa khai vẫn rơi về `templatePages.metaTitle`, nên
   * thêm mẫu mới không làm hỏng build. Nhưng nên khai, vì 63 title chỉ khác
   * nhau đúng cái tên thì không có từ khoá nào để bám — người ta tìm "thiệp
   * cưới tông xanh olive", không tìm "Lan Trắng".
   */
  metaTitle?: string;
  /**
   * Dòng mô tả ngắn nằm **bên trong `<h1>`**, cỡ nhỏ hơn tên mẫu.
   *
   * Tách khỏi `metaTitle` chứ không cắt chuỗi từ nó: `<title>` bị Google cắt ở
   * ~60 ký tự nên phải cô đặc, còn dòng này người thật đọc trên trang nên được
   * viết cho dễ đọc. Trộn hai vai vào một chuỗi thì sửa cái này hỏng cái kia.
   *
   * Không bắt buộc — mẫu chưa khai thì `h1` giữ nguyên dạng chỉ có tên.
   */
  headingNote?: string;
  metaDescription: string;
  intro: string[];
  highlights: string[];
  suitableFor: string;
  faqs: Array<{ question: string; answer: string }>;
};

/**
 * Chữ giới thiệu của mẫu `slug`, hoặc `undefined` khi mẫu đó chưa được viết.
 *
 * Có chữ hay không là **công tắc lập chỉ mục** của trang mẫu: mẫu chưa có chữ
 * thì trang vẫn dựng được (tên, nhãn, poster, tính năng) nhưng `noindex` và
 * không vào sitemap. Cho Google lưu 60 trang chỉ khác nhau ở tên mẫu là bị coi
 * là nội dung trùng lặp — thà để trống còn hơn.
 *
 * Chữ nằm trong từ điển (`templatePages.items.<slug>`) chứ không ở cột CMS vì
 * đây là bản thử trên một mẫu; khi đủ nhiều mẫu và biên tập muốn tự sửa thì mới
 * đáng một cột `description` có hai ngôn ngữ ở backend.
 */
export function templatePageCopy(
  dict: Dictionary,
  slug: string,
): TemplatePageCopy | undefined {
  const items: Record<string, TemplatePageCopy> = dict.templatePages.items;
  return items[slug];
}
