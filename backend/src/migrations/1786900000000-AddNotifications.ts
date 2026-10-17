import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Chuông thông báo trong ứng dụng. Bảng mới, không đụng bảng nào đang có, nên
 * `down` xoá sạch được — thông báo là dữ liệu phái sinh, mất đi không mất thứ
 * gì người dùng tự nhập.
 *
 * Hai index đều bắt đầu bằng `user_id` vì mọi truy vấn đều lọc theo người nhận:
 * một cho danh sách xếp theo thời gian, một cho phép đếm chưa đọc.
 */
export class AddNotifications1786900000000 implements MigrationInterface {
  name = 'AddNotifications1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('wish_pending')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL,
        "payload" jsonb NOT NULL,
        "group_key" character varying(120) NOT NULL,
        "last_event_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "read_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_last_event" ON "notifications" ("user_id", "last_event_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_read" ON "notifications" ("user_id", "read_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_user_read"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_user_last_event"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
