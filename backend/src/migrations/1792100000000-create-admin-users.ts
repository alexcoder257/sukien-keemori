import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bỏ Keycloak: tài khoản CMS về lại database, ở bảng riêng `admin_users` —
 * không trộn vào `users` (khách), để token và luật của hai bên không bao giờ
 * dính nhau.
 *
 * Kèm tài khoản quản trị đầu tiên (`super_admin`). Nằm ở migration chứ không ở
 * `seed.ts` vì production đã có dữ liệu thật, và seed không phải đường lên
 * production (CLAUDE.md, mục "Kho mẫu và migration"). Hash là bcrypt của
 * SHA-256 mật khẩu — đúng thứ dashboard gửi lên. **Đổi mật khẩu ngay** sau lần
 * đăng nhập đầu ở màn Tài khoản: mật khẩu khởi tạo nằm trong lịch sử git.
 *
 * `ON CONFLICT DO NOTHING` để chạy lại trên database đã có tài khoản này thì
 * không ghi đè mật khẩu đã đổi.
 */
export class CreateAdminUsers1792100000000 implements MigrationInterface {
  name = 'CreateAdminUsers1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."admin_users_role_enum" AS ENUM('super_admin', 'admin', 'editor', 'support', 'accountant')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "email" character varying(255) NOT NULL,
        "full_name" character varying(255),
        "role" "public"."admin_users_role_enum" NOT NULL DEFAULT 'editor',
        "password_hash" character varying(255) NOT NULL,
        "refresh_token_hash" character varying(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_admin_users" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_admin_users_email" ON "admin_users" ("email")`,
    );
    await queryRunner.query(
      `INSERT INTO "admin_users" ("email", "full_name", "role", "password_hash")
       VALUES ('admin@gmail.com', 'Admin', 'super_admin', '$2b$10$C4Fvy4E4qUyAowZyApXy1eia.ar6sACgR1tTgzXthqCmbonT.Xne.')
       ON CONFLICT ("email") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_users_email"`);
    await queryRunner.query(`DROP TABLE "admin_users"`);
    await queryRunner.query(`DROP TYPE "public"."admin_users_role_enum"`);
  }
}
