import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gỡ toàn bộ kho mẫu thiệp. Component, spec và asset của mọi mẫu đã bị xoá
 * khỏi repo, nên metadata trong database cũng phải đi theo — để lại thì kho mẫu
 * liệt kê những mẫu không còn gì để vẽ.
 *
 * Dọn mọi thứ chỉ có nghĩa khi mẫu còn tồn tại:
 * - đánh giá (kèm lượt "Hữu ích"), yêu thích và lượt xem theo ngày của mẫu;
 * - ô trong dải trang chủ trỏ tới trang demo của mẫu hoặc dùng ảnh trong
 *   `/images/templates/` — ảnh đó không còn, ô sẽ thành khung vỡ;
 * - nút hero đang trỏ tới demo của một mẫu thì về `null` (frontend rơi về
 *   thiệp mẫu mặc định);
 * - số liệu "mẫu thiệp" ở hero về 0 — để nguyên con số cũ là quảng cáo sai.
 *
 * **Không đụng `wedding_cards`.** Thiệp của khách không có khoá ngoại tới
 * `templates` (chỉ giữ `template_slug` dạng chuỗi), và frontend vẽ slug không
 * có trong registry bằng mẫu dự phòng `classic` — link đã gửi đi vẫn mở được.
 *
 * Không rollback được: component và asset đã bị xoá, còn đánh giá/yêu thích đã
 * mất không thể phục hồi trung thực. Dữ liệu viết thẳng ở đây, không import từ
 * `seeders/` (xem `CLAUDE.md` mục "Kho mẫu và migration").
 */
export class RemoveAllTemplates1794900000000 implements MigrationInterface {
  name = 'RemoveAllTemplates1794900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "template_review_helpful"`);
    await queryRunner.query(`DELETE FROM "template_reviews"`);
    await queryRunner.query(`DELETE FROM "template_daily_views"`);
    await queryRunner.query(`DELETE FROM "favorites"`);
    await queryRunner.query(`
      DELETE FROM "couple_showcases"
      WHERE "kind" = 'template'
        OR "image_src" LIKE '/images/templates/%'
        OR "poster_src" LIKE '/images/templates/%'
    `);
    await queryRunner.query(`
      UPDATE "site_settings"
      SET "demo_card_slug" = NULL, "demo_card_kind" = 'card'
      WHERE "demo_card_kind" = 'template'
    `);
    await queryRunner.query(
      `UPDATE "site_stats" SET "value" = 0 WHERE "key" = 'home.templates'`,
    );
    await queryRunner.query(`DELETE FROM "templates"`);
  }

  public async down(): Promise<void> {
    // Không thể phục hồi dữ liệu đã xoá — xem chú thích ở đầu file.
  }
}
