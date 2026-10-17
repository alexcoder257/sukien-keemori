import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Khoá tên cô dâu chú rể 15 ngày sau lần thanh toán đầu (Điều khoản sử dụng
 * 4.0, mục 3).
 *
 * `paid_at` backfill từ **đơn đã trả tiền sớm nhất** của thiệp — đó là mốc thật,
 * `orders.paid_at` chốt đúng lúc tiền về. Thiệp `paid` không có đơn nào (dữ liệu
 * seed, trưng bày) rơi về `published_at`, rồi `created_at`: để `NULL` thì thiệp
 * đó không bao giờ bị khoá.
 */
export class AddCoupleNamesLock1790600000000 implements MigrationInterface {
  name = 'AddCoupleNamesLock1790600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" ADD "paid_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" ADD "couple_names_unlocked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`
      UPDATE "wedding_cards" AS card
      SET "paid_at" = paid."first_paid_at"
      FROM (
        SELECT "card_id", MIN("paid_at") AS "first_paid_at"
        FROM "orders"
        WHERE "status" = 'paid' AND "paid_at" IS NOT NULL AND "card_id" IS NOT NULL
        GROUP BY "card_id"
      ) AS paid
      WHERE card."id" = paid."card_id" AND card."status" = 'paid'
    `);
    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "paid_at" = COALESCE("published_at", "created_at")
      WHERE "status" = 'paid' AND "paid_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" DROP COLUMN "couple_names_unlocked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" DROP COLUMN "paid_at"`,
    );
  }
}
