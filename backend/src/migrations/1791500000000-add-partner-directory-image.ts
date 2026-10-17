import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm nội dung ảnh cho card danh bạ đối tác.
 *
 * Tách khỏi migration hồ sơ đối tác trước đó vì migration đã chạy thì không
 * được sửa ngược lại: môi trường đã ghi `179120...` vào bảng migrations sẽ
 * không tự chạy thêm hai câu `ALTER TABLE` mới.
 *
 * Cửa hàng mẫu dùng thẳng asset thương hiệu tĩnh của frontend. Ảnh do đối tác
 * tự tải lên vẫn nằm dưới `/uploads/partners/<userId>/` và được service kiểm
 * quyền trước khi lưu URL.
 */
export class AddPartnerDirectoryImage1791500000000 implements MigrationInterface {
  name = 'AddPartnerDirectoryImage1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "description" character varying(300) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "image_url" character varying(500)`,
    );
    await queryRunner.query(
      `UPDATE "partner_stores" AS s
       SET "image_url" = '/images/site/brand/keemori-avatar-dark.png'
       FROM "users" AS u
       WHERE s."user_id" = u."id"
         AND u."email" = 'studio@keemori.com'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN "image_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN "description"`,
    );
  }
}
