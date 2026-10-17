import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Nối ngân hàng qua SePay: mã đơn trên `orders` và sổ cái `payment_transactions`.
 *
 * `orders.payment_code` là **partial unique index** (`WHERE ... IS NOT NULL`)
 * chứ không phải `UNIQUE` thường: cột này nullable, và trong
 * Postgres thì nhiều `NULL` không va nhau ở unique index — nhưng khai partial
 * nói rõ ý định đó ra thay vì dựa vào một chi tiết dễ hiểu nhầm.
 *
 * `down` xoá được sạch vì bảng mới hoàn toàn; riêng `payment_code` mất đi thì
 * các đơn đang chờ mất đường nhận diện — chạy `down` trên môi trường thật chỉ
 * an toàn khi không còn đơn `pending` nào.
 */
export class AddSepayPayments1787000000000 implements MigrationInterface {
  name = 'AddSepayPayments1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "payment_code" character varying(20)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_orders_payment_code" ON "orders" ("payment_code") WHERE "payment_code" IS NOT NULL`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."payment_transactions_match_status_enum" AS ENUM('matched', 'unmatched', 'manual', 'underpaid', 'ignored')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "sepay_id" bigint NOT NULL,
        "order_id" uuid,
        "match_status" "public"."payment_transactions_match_status_enum" NOT NULL,
        "gateway" character varying(60) NOT NULL,
        "account_number" character varying(40) NOT NULL,
        "sub_account" character varying(40),
        "transfer_amount" bigint NOT NULL,
        "content" text NOT NULL,
        "payment_code" character varying(20),
        "reference_code" character varying(120),
        "transaction_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "raw_payload" jsonb NOT NULL,
        CONSTRAINT "PK_payment_transactions" PRIMARY KEY ("id")
      )`,
    );
    // Khoá chống lặp: SePay thử lại tới 7 lần trong 5 giờ, nên cùng một giao
    // dịch chắc chắn về nhiều lần. Đây là hàng rào thật, không phải kiểm tra
    // trong code.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_payment_transactions_sepay_id" ON "payment_transactions" ("sepay_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_transactions_order" ON "payment_transactions" ("order_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_payment_transactions_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_payment_transactions_order"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payment_transactions_order"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payment_transactions_sepay_id"`,
    );
    await queryRunner.query(`DROP TABLE "payment_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."payment_transactions_match_status_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_payment_code"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_code"`);
  }
}
