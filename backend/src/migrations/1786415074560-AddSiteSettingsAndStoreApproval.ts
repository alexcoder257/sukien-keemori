import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bù phần schema sinh sau `InitSchema`: bảng `site_settings` và ba cột duyệt
 * đơn của `partner_stores`.
 *
 * Cả hai đã có trong entity từ lâu nhưng chưa ai sinh migration, nên
 * `GET /admin/settings` ném 500 và luồng duyệt đối tác không thể chạy trên một
 * DB dựng bằng migration. Đây là bằng chứng vì sao `DB_SYNCHRONIZE=false` phải
 * đi kèm thói quen chạy `migration:generate` mỗi lần đổi entity.
 */
export class AddSiteSettingsAndStoreApproval1786415074560 implements MigrationInterface {
  name = 'AddSiteSettingsAndStoreApproval1786415074560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "site_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "unpaid_link_days" integer NOT NULL DEFAULT '3', "unpaid_viewer_limit" integer NOT NULL DEFAULT '15', CONSTRAINT "PK_e4290e8371a166d7e066d131f6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."partner_stores_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "status" "public"."partner_stores_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "rejection_reason" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "reviewed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab3cf45ec402f9b4cb4a850bc3" ON "partner_stores"  ("status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab3cf45ec402f9b4cb4a850bc3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN "reviewed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN "rejection_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN "status"`,
    );
    await queryRunner.query(`DROP TYPE "public"."partner_stores_status_enum"`);
    await queryRunner.query(`DROP TABLE "site_settings"`);
  }
}
