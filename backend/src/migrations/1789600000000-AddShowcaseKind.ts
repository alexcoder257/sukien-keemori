import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ô trưng bày trên trang chủ được phép trỏ tới **bản demo của một mẫu**, không
 * chỉ tới một thiệp đã dựng.
 *
 * Lý do: kho mẫu có hơn 60 mẫu, mẫu nào cũng có sẵn trang
 * `/mau-thiep/<slug>/demo`, trong khi thiệp demo dựng sẵn chỉ có mười mấy. Bắt
 * người vận hành chỉ chọn trong số thiệp đã dựng là tự giới hạn xuống một phần
 * năm kho mẫu.
 *
 * Cột `kind` mặc định `'card'` và mọi hàng có sẵn giữ nguyên nghĩa cũ — đây là
 * lý do không dùng kiểu enum của Postgres: enum thì thêm giá trị phải
 * `ALTER TYPE`, còn ở đây một cột `varchar` kèm whitelist ở DTO đã đủ, và
 * `SHOWCASE_KINDS` là nơi duy nhất khai danh sách.
 */
export class AddShowcaseKind1789600000000 implements MigrationInterface {
  name = 'AddShowcaseKind1789600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "couple_showcases" ADD COLUMN IF NOT EXISTS "kind" character varying(20) NOT NULL DEFAULT 'card'`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "demo_card_kind" character varying(20) NOT NULL DEFAULT 'card'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "demo_card_kind"`,
    );
    await queryRunner.query(
      `ALTER TABLE "couple_showcases" DROP COLUMN IF EXISTS "kind"`,
    );
  }
}
