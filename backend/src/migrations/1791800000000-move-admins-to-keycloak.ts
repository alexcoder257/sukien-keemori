import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tài khoản quản trị chuyển sang Keycloak: bảng `users` chỉ còn khách.
 *
 * Ba bước, theo đúng thứ tự:
 * 1. Hạ mọi hàng `admin`/`super_admin` về `customer` **và** xoá refresh token
 *    của chúng. Không xoá hàng: tài khoản đó có thể đang sở hữu thiệp và đơn
 *    hàng thật — người vận hành cũng từng cưới. Xoá refresh token để phiên đang
 *    mở không sống tiếp với quyền cũ nằm trong access token.
 * 2. Dựng lại enum không còn hai giá trị đó. Postgres không bỏ được một giá trị
 *    enum, nên phải đổi tên type cũ, tạo type mới rồi ép cột sang.
 * 3. Nới `audit_logs.actor_role` lên 128 ký tự: giờ nó chứa danh sách role
 *    tổ hợp Keycloak (`cms-admin,cms-editor`) thay vì một từ `admin`.
 *
 * Người vận hành phải được tạo lại trong Keycloak **trước** khi deploy bản
 * này, nếu không sẽ không còn ai vào được CMS (xem `ops/keycloak/README.md`).
 *
 * Chiều `down` chỉ trả lại hai giá trị enum; nó **không** biết ai từng là
 * admin, nên không nâng lại được ai.
 */
export class MoveAdminsToKeycloak1791800000000 implements MigrationInterface {
  name = 'MoveAdminsToKeycloak1791800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'customer', "refresh_token_hash" = NULL WHERE "role" IN ('admin', 'super_admin')`,
    );
    await this.recreateEnum(queryRunner, ['customer', 'partner']);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "actor_role" TYPE varchar(128)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "audit_logs" SET "actor_role" = left("actor_role", 32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "actor_role" TYPE varchar(32)`,
    );
    await this.recreateEnum(queryRunner, [
      'customer',
      'partner',
      'admin',
      'super_admin',
    ]);
  }

  private async recreateEnum(
    queryRunner: QueryRunner,
    values: string[],
  ): Promise<void> {
    const list = values.map((value) => `'${value}'`).join(', ');
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM(${list})`,
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
