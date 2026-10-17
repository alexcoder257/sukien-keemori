import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Xoá mẫu Cực Quang vì trùng art direction với một mẫu khác trong danh mục.
 *
 * `wedding_cards.template_slug` là chuỗi, không phải khoá ngoại tới `templates`,
 * nên phải chuyển các thiệp đang dùng mẫu cũ trước khi xoá metadata. Yêu thích
 * và đánh giá không được chuyển sang mẫu thay thế: đó là hành động/nhận xét dành
 * cho đúng sản phẩm cũ, gộp sang sản phẩm khác sẽ làm sai dữ liệu người dùng.
 *
 * Migration không thể rollback: asset, component và spec Cực Quang đã bị xoá,
 * còn đánh giá/yêu thích đã mất không thể phục hồi trung thực.
 */
export class RemoveCucQuangTemplate1788300000000 implements MigrationInterface {
  name = 'RemoveCucQuangTemplate1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "wedding_cards" SET "template_slug" = 'nang-xanh', "template_tier" = 'gold' WHERE "template_slug" = 'cuc-quang'`,
    );
    await queryRunner.query(
      `DELETE FROM "favorites" WHERE "template_slug" = 'cuc-quang'`,
    );
    await queryRunner.query(
      `DELETE FROM "template_reviews" WHERE "template_slug" = 'cuc-quang'`,
    );
    await queryRunner.query(
      `DELETE FROM "templates" WHERE "slug" = 'cuc-quang'`,
    );
  }

  public async down(): Promise<void> {
    // Không thể phục hồi dữ liệu đã xoá — xem chú thích ở đầu file.
  }
}
