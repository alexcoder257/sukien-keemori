import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Làm lại phần đối tác, hai thay đổi schema:
 *
 * - `partner_stores.address` + `social_url`: đơn tự nộp giờ bắt buộc đủ tên,
 *   số điện thoại, địa chỉ và link mạng xã hội (`ApplyPartnerStoreDto`). Cột
 *   `NOT NULL DEFAULT ''` như `phone`, vì admin nâng thẳng một tài khoản
 *   (`promote`) thì chưa biết hai giá trị này. Hàng cũ nhận `''`.
 * - `vouchers.partner_store_id`: mã độc quyền của một cửa hàng. `NULL` là mã
 *   chung — mọi mã đang có giữ nguyên hành vi. `SET NULL` khi xoá cửa hàng để
 *   `orders.voucher_id` không mất dấu chiến dịch.
 */
export class AddPartnerProfileAndStoreVouchers1791200000000 implements MigrationInterface {
  name = 'AddPartnerProfileAndStoreVouchers1791200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "address" character varying(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "social_url" character varying(500) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "partner_store_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vouchers_partner_store" ON "vouchers" ("partner_store_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD CONSTRAINT "FK_vouchers_partner_store" FOREIGN KEY ("partner_store_id") REFERENCES "partner_stores"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "FK_vouchers_partner_store"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_vouchers_partner_store"`);
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP COLUMN "partner_store_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN "social_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN "address"`,
    );
  }
}
