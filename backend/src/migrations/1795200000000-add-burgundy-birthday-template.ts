import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Kho mẫu biết **loại thiệp** của từng mẫu (`templates.kind`), rồi thêm mẫu
 * sinh nhật đầu tiên: Burgundy Birthday — thiệp custom của Khải Hồ được dựng
 * lại thành mẫu để editor, link mời riêng, xác nhận tham dự và sổ lưu bút chạy
 * được trên nó.
 *
 * Mọi mẫu đã có là mẫu cưới, nên `DEFAULT 'wedding'` là giá trị đúng cho cả
 * các hàng cũ. Một ô ảnh (`cover`) nên mẫu thuộc cấp Gold.
 */
export class AddBurgundyBirthdayTemplate1795200000000 implements MigrationInterface {
  name = 'AddBurgundyBirthdayTemplate1795200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."templates_kind_enum" AS ENUM('wedding', 'birthday', 'graduation', 'event', 'anniversary', 'greeting')`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ADD "kind" "public"."templates_kind_enum" NOT NULL DEFAULT 'wedding'`,
    );
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "kind", "categories", "color_tones", "tags",
        "photo_slots", "image_position", "image_src", "sort_order"
      )
      SELECT
        'burgundy-birthday', 'Burgundy', 'gold', 'birthday',
        '{luxury,formal}', '{red,white}', '{new}',
        '{cover}', '50% 0%',
        '/images/templates/burgundy-birthday/thumbnail.avif',
        COALESCE(MAX("sort_order"), -1) + 1
      FROM "templates"
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Giữ hàng mẫu: thiệp đã chọn mẫu này vẫn cần metadata của nó.
    await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "kind"`);
    await queryRunner.query(`DROP TYPE "public"."templates_kind_enum"`);
  }
}
