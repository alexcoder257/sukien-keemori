import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Xoá mẫu Hỷ Báo khỏi danh mục và dọn dữ liệu gắn trực tiếp với mẫu.
 *
 * Các thiệp đang dùng Hỷ Báo được chuyển sang Thiên Thanh trước khi metadata
 * bị xoá. Cả hai đều thuộc gói Gold và cùng nhóm classic/formal; ô `cover` của
 * Hỷ Báo vẫn có chỗ tương ứng trong Thiên Thanh nên ảnh khách không bị mất.
 *
 * Yêu thích và đánh giá không được chuyển sang mẫu thay thế vì chúng phản ánh
 * hành động của người dùng dành riêng cho sản phẩm cũ.
 *
 * Migration không rollback được: component, spec và asset Hỷ Báo đã bị xoá,
 * còn đánh giá/yêu thích đã mất không thể phục hồi trung thực.
 */
export class RemoveHyBaoTemplate1788700000000 implements MigrationInterface {
  name = 'RemoveHyBaoTemplate1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "wedding_cards" SET "template_slug" = 'thien-thanh', "template_tier" = 'gold' WHERE "template_slug" = 'hy-bao'`,
    );
    await queryRunner.query(
      `DELETE FROM "favorites" WHERE "template_slug" = 'hy-bao'`,
    );
    await queryRunner.query(
      `DELETE FROM "template_reviews" WHERE "template_slug" = 'hy-bao'`,
    );
    await queryRunner.query(`DELETE FROM "templates" WHERE "slug" = 'hy-bao'`);
  }

  public async down(): Promise<void> {
    // Không thể phục hồi dữ liệu đã xoá — xem chú thích ở đầu file.
  }
}
