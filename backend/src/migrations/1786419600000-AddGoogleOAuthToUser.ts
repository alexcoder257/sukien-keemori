import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đăng nhập bằng Google: thêm `google_id` (khoá nối tài khoản) và `avatar_url`,
 * đồng thời cho `password_hash` nhận NULL.
 *
 * `password_hash` phải nullable vì tài khoản tạo qua Google chưa từng đặt mật
 * khẩu. `down` chỉ trả lại NOT NULL được khi không còn hàng nào NULL, nên nó
 * xoá luôn các tài khoản chỉ-Google — đây là migration một chiều trên thực tế.
 */
export class AddGoogleOAuthToUser1786419600000 implements MigrationInterface {
  name = 'AddGoogleOAuthToUser1786419600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "google_id" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatar_url" character varying(500)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_google_id" ON "users" ("google_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_google_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    await queryRunner.query(
      `DELETE FROM "users" WHERE "password_hash" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`,
    );
  }
}
