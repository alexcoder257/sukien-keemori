import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Diamond Song Hỷ — thiệp riêng nhà trai / nhà gái.
 *
 * Migration này **chỉ thêm**: mọi cột mới hoặc nullable, hoặc có `DEFAULT`
 * mang đúng nghĩa của dữ liệu đã có, và không `UPDATE` hàng nào của thiệp,
 * khách mời, phản hồi hay đơn hàng. Thiệp đã tạo không đổi gì cho tới khi chủ
 * thiệp tự bật tính năng:
 *
 * - `wedding_cards.groom_slug` / `bride_slug` / `family_split_paid_at`: `NULL`.
 * - `card_guests.side` và `rsvps.side`: `'groom'` — mọi khách và phản hồi có
 *   từ trước đều đến từ link chung, mà link chung là thiệp nhà trai.
 * - `orders.family_split`: `false` — chưa đơn nào mua Song Hỷ.
 *
 * Hàng duy nhất được ghi là hàng `diamond` của `tier_prices`, và chỉ vào hai
 * cột giá vừa thêm — giá khởi điểm của Song Hỷ, admin đổi được ở `/bang-gia`.
 * Giá viết thẳng ở đây chứ không đọc từ seed: migration là lát cắt đông cứng.
 */
export class AddFamilySplit1793200000000 implements MigrationInterface {
  name = 'AddFamilySplit1793200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "wedding_cards"
        ADD COLUMN "groom_slug" character varying(60),
        ADD COLUMN "bride_slug" character varying(60),
        ADD COLUMN "family_split_paid_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_wedding_cards_groom_slug" ON "wedding_cards" ("groom_slug") WHERE groom_slug IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_wedding_cards_bride_slug" ON "wedding_cards" ("bride_slug") WHERE bride_slug IS NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "card_guests" ADD COLUMN "side" character varying(10) NOT NULL DEFAULT 'groom'`,
    );
    await queryRunner.query(
      `ALTER TABLE "rsvps" ADD COLUMN "side" character varying(10) NOT NULL DEFAULT 'groom'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN "family_split" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(`
      ALTER TABLE "tier_prices"
        ADD COLUMN "family_split_price" integer,
        ADD COLUMN "family_split_discount_percent" integer,
        ADD COLUMN "family_split_upgrade_price" integer
    `);
    await queryRunner.query(`
      UPDATE "tier_prices"
      SET "family_split_price" = 299000,
          "family_split_upgrade_price" = 99000
      WHERE "tier" = 'diamond'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tier_prices"
        DROP COLUMN "family_split_upgrade_price",
        DROP COLUMN "family_split_discount_percent",
        DROP COLUMN "family_split_price"
    `);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "family_split"`);
    await queryRunner.query(`ALTER TABLE "rsvps" DROP COLUMN "side"`);
    await queryRunner.query(`ALTER TABLE "card_guests" DROP COLUMN "side"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_wedding_cards_bride_slug"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_wedding_cards_groom_slug"`,
    );
    await queryRunner.query(`
      ALTER TABLE "wedding_cards"
        DROP COLUMN "family_split_paid_at",
        DROP COLUMN "bride_slug",
        DROP COLUMN "groom_slug"
    `);
  }
}
