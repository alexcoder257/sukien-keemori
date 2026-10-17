import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hai đường giảm giá cho giá tiền của gói.
 *
 * 1. `tier_prices.discount_percent` — khuyến mãi của gói, admin bật/tắt ở CMS.
 *    Nullable chứ không `default 0`: trang bảng giá phân biệt "chưa cấu hình"
 *    với "giảm 0%" bằng chính giá trị này.
 * 2. `vouchers` + `voucher_redemptions` — mã khách nhập ở hộp thanh toán, tính
 *    **sau** khuyến mãi gói.
 *
 * `orders` giữ lại đủ dấu vết để dựng biên nhận về sau (`list_amount`,
 * `discount_amount`, `voucher_id`, `voucher_code`) — suy ngược từ bảng giá
 * không được, vì admin đổi giá và dừng chiến dịch bất cứ lúc nào.
 */
export class AddDiscountsAndVouchers1788000000000 implements MigrationInterface {
  name = 'AddDiscountsAndVouchers1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tier_prices" ADD "discount_percent" integer`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_discount_type_enum" AS ENUM('percent', 'amount')`,
    );
    await queryRunner.query(`
      CREATE TABLE "vouchers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "code" character varying(32) NOT NULL,
        "description" character varying(255),
        "discount_type" "public"."vouchers_discount_type_enum" NOT NULL,
        "discount_value" integer NOT NULL,
        "max_discount" integer,
        "tiers" text NOT NULL DEFAULT '',
        "min_amount" integer NOT NULL DEFAULT 0,
        "starts_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "usage_limit" integer,
        "used_count" integer NOT NULL DEFAULT 0,
        "per_user_limit" integer DEFAULT 1,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_vouchers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_vouchers_code" ON "vouchers" ("code")`,
    );

    await queryRunner.query(`
      CREATE TABLE "voucher_redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "voucher_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "discount_amount" integer NOT NULL,
        CONSTRAINT "PK_voucher_redemptions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_voucher_redemptions_voucher" ON "voucher_redemptions" ("voucher_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_voucher_redemptions_user" ON "voucher_redemptions" ("user_id")`,
    );
    // Unique chứ không chỉ index: webhook SePay thử lại tới 7 lần, và ràng buộc
    // ở database mới là thứ chặn được hai luồng cùng ghi nhận một đơn.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_voucher_redemptions_order" ON "voucher_redemptions" ("order_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "voucher_redemptions"
      ADD CONSTRAINT "FK_voucher_redemptions_voucher"
      FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "voucher_redemptions"
      ADD CONSTRAINT "FK_voucher_redemptions_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "voucher_redemptions"
      ADD CONSTRAINT "FK_voucher_redemptions_order"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `ALTER TABLE "orders" ADD "list_amount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "discount_amount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "voucher_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "voucher_code" character varying(32)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_voucher" ON "orders" ("voucher_id")`,
    );
    // Xoá một mã đã hết chiến dịch không được kéo theo đơn hàng: `SET NULL`
    // chứ không `CASCADE`. `voucher_code` giữ lại chữ của mã cho biên nhận cũ.
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_voucher"
      FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Đơn cũ chưa có giá niêm yết riêng — lúc đó chưa có đường giảm giá nào,
    // nên giá niêm yết đúng bằng số đã trả.
    await queryRunner.query(
      `UPDATE "orders" SET "list_amount" = "amount" WHERE "list_amount" = 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_voucher"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_voucher"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "voucher_code"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "voucher_id"`);
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "discount_amount"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "list_amount"`);

    await queryRunner.query(`DROP TABLE "voucher_redemptions"`);
    await queryRunner.query(`DROP TABLE "vouchers"`);
    await queryRunner.query(`DROP TYPE "public"."vouchers_discount_type_enum"`);

    await queryRunner.query(
      `ALTER TABLE "tier_prices" DROP COLUMN "discount_percent"`,
    );
  }
}
