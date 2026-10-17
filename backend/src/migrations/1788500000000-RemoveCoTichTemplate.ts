import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Xoá mẫu Cổ Tích khỏi danh mục.
 *
 * Component, spec và asset của mẫu đã bị gỡ khỏi mã nguồn; migration này dọn
 * nốt phần dữ liệu. Cùng hình dạng với `RemoveCucQuangTemplate`, và vì cùng
 * một lý do: `wedding_cards.template_slug` là chuỗi chứ không phải khoá ngoại
 * tới `templates`, nên thiệp đang dùng mẫu cũ phải được chuyển **trước** khi
 * xoá metadata — nếu không chúng trỏ vào một slug không còn ai dựng được.
 *
 * Thay bằng **Thiên Thanh**: cùng gói `gold`, cùng bộ phân loại
 * `classic + formal`, và ô ảnh của nó (`cover, couple, story`) phủ trọn hai ô
 * của Cổ Tích (`cover, couple`) nên không tấm ảnh nào của khách bị mất chỗ
 * hiển thị. Bảng màu sứ lam cũng là thứ gần art direction cũ nhất.
 *
 * Yêu thích và đánh giá **không** được chuyển sang mẫu thay thế: đó là hành
 * động và nhận xét dành cho đúng sản phẩm cũ, gộp sang sản phẩm khác là bịa ra
 * dữ liệu người dùng chưa từng tạo.
 *
 * Migration không rollback được: asset, component và spec Cổ Tích đã bị xoá,
 * còn đánh giá/yêu thích đã mất thì không phục hồi trung thực được.
 */
export class RemoveCoTichTemplate1788500000000 implements MigrationInterface {
  name = 'RemoveCoTichTemplate1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "wedding_cards" SET "template_slug" = 'thien-thanh', "template_tier" = 'gold' WHERE "template_slug" = 'co-tich'`,
    );
    await queryRunner.query(
      `DELETE FROM "favorites" WHERE "template_slug" = 'co-tich'`,
    );
    await queryRunner.query(
      `DELETE FROM "template_reviews" WHERE "template_slug" = 'co-tich'`,
    );
    await queryRunner.query(`DELETE FROM "templates" WHERE "slug" = 'co-tich'`);
  }

  public async down(): Promise<void> {
    // Không thể phục hồi dữ liệu đã xoá — xem chú thích ở đầu file.
  }
}
