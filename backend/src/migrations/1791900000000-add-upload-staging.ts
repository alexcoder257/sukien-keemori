import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vùng tạm của ảnh editor: `upload_sessions` (phiên soạn thiệp, có trước cả tài
 * khoản) và `staged_photos` (từng tấm ảnh, đồng thời là hàng đợi nén).
 *
 * Xem `UploadStagingService` cho luồng và `ImageQueueProcessor` cho hàng đợi.
 * Hai bảng chỉ giữ dữ liệu sống tối đa một ngày, nên không có khoá ngoại nào
 * trỏ sang `users` hay `wedding_cards`: xoá tài khoản hay thiệp không cần kéo
 * theo chúng, cron tự dọn.
 *
 * Index hàng đợi `(status, priority, created_at)` khớp đúng câu rút việc của
 * worker (`WHERE status = 'queued' ORDER BY priority DESC, created_at`).
 */
export class AddUploadStaging1791900000000 implements MigrationInterface {
  name = 'AddUploadStaging1791900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "upload_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "secret_hash" character varying(64) NOT NULL,
        "user_id" uuid,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_upload_sessions" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_upload_sessions_expires_at" ON "upload_sessions" ("expires_at")`,
    );

    await queryRunner.query(
      `CREATE TABLE "staged_photos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "session_id" uuid NOT NULL,
        "kind" character varying(8) NOT NULL,
        "status" character varying(16) NOT NULL,
        "content_type" character varying(32) NOT NULL,
        "size" integer,
        "priority" integer NOT NULL DEFAULT 0,
        "attempts" integer NOT NULL DEFAULT 0,
        "locked_at" TIMESTAMP WITH TIME ZONE,
        "card_id" uuid,
        "url" character varying(512),
        "error" character varying(32),
        CONSTRAINT "CHK_staged_photos_status" CHECK ("status" IN ('uploading', 'queued', 'processing', 'ready', 'publishing', 'published', 'failed')),
        CONSTRAINT "CHK_staged_photos_kind" CHECK ("kind" IN ('photo', 'album')),
        CONSTRAINT "PK_staged_photos" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_staged_photos_session" ON "staged_photos" ("session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_staged_photos_queue" ON "staged_photos" ("status", "priority", "created_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "staged_photos" ADD CONSTRAINT "FK_staged_photos_session" FOREIGN KEY ("session_id") REFERENCES "upload_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "staged_photos" DROP CONSTRAINT "FK_staged_photos_session"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_staged_photos_queue"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_staged_photos_session"`);
    await queryRunner.query(`DROP TABLE "staged_photos"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_upload_sessions_expires_at"`,
    );
    await queryRunner.query(`DROP TABLE "upload_sessions"`);
  }
}
