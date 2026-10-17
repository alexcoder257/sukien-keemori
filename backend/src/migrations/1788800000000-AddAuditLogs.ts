import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bảng nhật ký thao tác.
 *
 * **Không có khoá ngoại nào**, và đó là điểm quan trọng nhất của migration này.
 * Chín khoá ngoại trỏ về `users` trong hệ thống đều là `ON DELETE CASCADE`;
 * thêm một cái nữa ở đây thì xoá tài khoản sẽ cuốn theo chính dòng ghi lại việc
 * xoá đó. `actor_id` và `target_id` vì vậy là `uuid` trần, và mỗi dòng mang
 * theo ảnh chụp (`actor_email`, `target_label`) để tự đọc được sau khi hàng gốc
 * đã biến mất.
 *
 * `action` và `target_type` là `varchar` chứ không phải enum của Postgres: giá
 * trị hợp lệ đã được `class-validator` chặn ở biên API, mà enum của Postgres thì
 * chỉ thêm được giá trị bằng `ALTER TYPE` trong một migration riêng — mỗi loại
 * sự kiện mới sẽ thành một lần deploy database. Đây là bảng chỉ ghi thêm, không
 * join, nên không mất gì khi dùng varchar.
 *
 * Index đặt theo đúng ba câu hỏi lúc có sự cố: "đã có chuyện gì xảy ra với đối
 * tượng này" (`target_id`), "người này đã làm những gì" (`actor_id`), "gần đây
 * có ai xoá gì không" (`action`, và `created_at DESC` cho mặc định của bảng).
 */
export class AddAuditLogs1788800000000 implements MigrationInterface {
  name = 'AddAuditLogs1788800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "action" character varying(64) NOT NULL,
        "actor_id" uuid,
        "actor_email" character varying(255),
        "actor_role" character varying(32),
        "target_type" character varying(32) NOT NULL,
        "target_id" uuid,
        "target_label" character varying(255),
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "ip_address" character varying(64),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actor_id" ON "audit_logs" ("actor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_target_type" ON "audit_logs" ("target_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_target_id" ON "audit_logs" ("target_id")`,
    );
    // Bảng luôn được đọc theo thứ tự mới nhất trước; không có index này thì mỗi
    // lần mở màn nhật ký là một lần quét toàn bảng, và bảng này chỉ có lớn lên.
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
