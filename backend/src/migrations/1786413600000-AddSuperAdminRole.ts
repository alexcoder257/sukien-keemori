import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm `super_admin` vào enum quyền.
 *
 * `USER_ROLES` đã khai bốn quyền nhưng `InitSchema` chỉ tạo ba — mọi thao tác
 * gán `super_admin` đều chết ở tầng Postgres. Postgres không cho bỏ một giá
 * trị enum, nên chiều `down` phải dựng lại type: hạ mọi tài khoản
 * `super_admin` xuống `admin` trước, không thì việc ép kiểu sẽ hỏng.
 */
export class AddSuperAdminRole1786413600000 implements MigrationInterface {
  name = 'AddSuperAdminRole1786413600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'super_admin'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'admin' WHERE "role" = 'super_admin'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'partner', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
  }
}
