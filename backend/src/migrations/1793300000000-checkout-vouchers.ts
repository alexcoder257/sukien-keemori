import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckoutVouchers1793300000000 implements MigrationInterface {
  name = 'CheckoutVouchers1793300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD COLUMN "is_public" boolean NOT NULL DEFAULT false`,
    );
    // Diamond từng bao gồm Song Hỷ: giữ phạm vi mã đã phát, rồi CMS có thể
    // chọn riêng từng gói cho các chiến dịch mới.
    await queryRunner.query(`
      UPDATE "vouchers"
      SET "tiers" = "tiers" || ',family-split'
      WHERE 'diamond' = ANY(string_to_array("tiers", ','))
        AND NOT ('family-split' = ANY(string_to_array("tiers", ',')))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "vouchers"
      SET "tiers" = array_to_string(
        array_remove(string_to_array("tiers", ','), 'family-split'), ','
      )
      WHERE 'family-split' = ANY(string_to_array("tiers", ','))
    `);
    await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "is_public"`);
  }
}
