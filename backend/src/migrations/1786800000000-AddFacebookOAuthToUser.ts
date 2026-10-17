import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đăng nhập bằng Facebook: thêm `facebook_id`, khoá nối tài khoản giống
 * `google_id`. Unique index để một tài khoản Facebook chỉ nối được vào đúng
 * một người dùng.
 *
 * `password_hash` đã nullable từ migration Google nên ở đây không đụng tới.
 * `down` chỉ xoá cột — tài khoản tạo qua Facebook vẫn còn nhưng mất đường đăng
 * nhập, đúng như khi gỡ một nhà cung cấp OAuth.
 */
export class AddFacebookOAuthToUser1786800000000 implements MigrationInterface {
  name = 'AddFacebookOAuthToUser1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "facebook_id" character varying(64)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_facebook_id" ON "users" ("facebook_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_facebook_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "facebook_id"`);
  }
}
