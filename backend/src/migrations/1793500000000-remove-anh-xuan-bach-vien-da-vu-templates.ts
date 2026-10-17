import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Xoá ba mẫu Ánh Xuân, Bạch Viên và Dạ Vũ khỏi danh mục và dọn dữ liệu gắn
 * trực tiếp với mẫu.
 *
 * Thiệp đang dùng một trong ba mẫu được chuyển sang mẫu Diamond gần nhất về
 * màu và phong cách trước khi metadata bị xoá:
 * - `anh-xuan` (xanh · trắng) → `hoa-cam-tu-cau`
 * - `bach-vien` (trắng · nâu, cổ điển · sang trọng) → `nang-hen`
 * - `da-vu` (đỏ · trắng, sang trọng · cổ điển) → `do-burgundy`
 * Cả ba mẫu cũ có ô `groom`/`bride` mà mẫu thay thế không có; ảnh trong các ô
 * đó vẫn nằm trong `content`, chỉ tạm không hiển thị.
 *
 * Yêu thích và đánh giá không được chuyển sang mẫu thay thế vì chúng phản ánh
 * hành động của người dùng dành riêng cho sản phẩm cũ. Nút hero đang trỏ tới
 * trang demo của một trong ba mẫu thì về `null` — frontend rơi về thiệp mẫu
 * mặc định.
 *
 * Migration không rollback được: component, spec và asset của ba mẫu đã bị
 * xoá, còn đánh giá/yêu thích đã mất không thể phục hồi trung thực.
 */
export class RemoveAnhXuanBachVienDaVuTemplates1793500000000 implements MigrationInterface {
  name = 'RemoveAnhXuanBachVienDaVuTemplates1793500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "template_tier" = 'diamond',
        "template_slug" = CASE "template_slug"
          WHEN 'anh-xuan' THEN 'hoa-cam-tu-cau'
          WHEN 'bach-vien' THEN 'nang-hen'
          WHEN 'da-vu' THEN 'do-burgundy'
        END
      WHERE "template_slug" IN ('anh-xuan', 'bach-vien', 'da-vu')
    `);
    await queryRunner.query(
      `DELETE FROM "favorites" WHERE "template_slug" IN ('anh-xuan', 'bach-vien', 'da-vu')`,
    );
    await queryRunner.query(
      `DELETE FROM "template_reviews" WHERE "template_slug" IN ('anh-xuan', 'bach-vien', 'da-vu')`,
    );
    await queryRunner.query(`
      UPDATE "site_settings"
      SET "demo_card_slug" = NULL
      WHERE "demo_card_kind" = 'template'
        AND "demo_card_slug" IN ('anh-xuan', 'bach-vien', 'da-vu')
    `);
    await queryRunner.query(
      `DELETE FROM "templates" WHERE "slug" IN ('anh-xuan', 'bach-vien', 'da-vu')`,
    );
  }

  public async down(): Promise<void> {
    // Không thể phục hồi dữ liệu đã xoá — xem chú thích ở đầu file.
  }
}
