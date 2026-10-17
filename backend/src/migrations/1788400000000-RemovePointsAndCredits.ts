import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gỡ toàn bộ đơn vị **point/credit** khỏi hệ thống.
 *
 * Đối tác B2B vẫn còn (`partner_stores`, `partner_profiles`,
 * `partner_program_tiers`, quyền `partner`); chỉ có đơn vị quy đổi biến mất —
 * từ đây mọi đơn đều trả bằng tiền.
 *
 * Bốn nhóm thay đổi, và nhóm nào cũng **một chiều**:
 *
 * 1. Hai sổ point (`point_top_ups`, `credit_transactions`) bị `DROP`, kèm hai
 *    cột số dư (`partner_stores.points`, `partner_program_tiers.points`) và hai
 *    cột giá point (`tier_prices.points`, `tier_prices.repeat_points`).
 * 2. `orders.payment_method` biến mất cùng enum của nó: chỉ còn đúng một cách
 *    trả tiền nên cột đó không phân biệt được gì nữa. Đơn point cũ còn ở trạng
 *    thái `pending` được huỷ trước khi bỏ cột — để nguyên thì chúng thành đơn
 *    chuyển khoản không có `payment_code`, tức đơn không bao giờ trả được.
 * 3. `credit_policy` bị gỡ khỏi enum văn bản pháp lý. Postgres không xoá được
 *    một giá trị enum, nên phải dựng type mới rồi đổi cột sang; các hàng đã
 *    chấp thuận văn bản đó bị xoá vì văn bản không còn tồn tại để tham chiếu.
 * 4. FAQ "Point là gì?" bị xoá khỏi nội dung đã seed.
 *
 * `down` chỉ dựng lại **hình dạng** bảng, không dựng lại dữ liệu: sổ point đã
 * mất là mất hẳn.
 */
export class RemovePointsAndCredits1788400000000 implements MigrationInterface {
  name = 'RemovePointsAndCredits1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* ------------------------------------------------------- sổ point */
    await queryRunner.query(`DROP TABLE IF EXISTS "credit_transactions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."credit_transactions_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "point_top_ups"`);

    /* ---------------------------------------------------- cột số dư/giá */
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN IF EXISTS "points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_program_tiers" DROP COLUMN IF EXISTS "points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tier_prices" DROP COLUMN IF EXISTS "points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tier_prices" DROP COLUMN IF EXISTS "repeat_points"`,
    );

    /* ------------------------------------------- cách thanh toán của đơn */
    // Đơn point đang chờ không còn đường nào để trả: huỷ trước khi bỏ cột.
    await queryRunner.query(`
      UPDATE "orders" SET "status" = 'cancelled'
      WHERE "status" = 'pending' AND "payment_method" = 'points'
    `);
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_method"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."orders_payment_method_enum"`,
    );

    /* -------------------------------------------- văn bản Chính sách Credits */
    await queryRunner.query(
      `DELETE FROM "legal_acceptances" WHERE "document_type" = 'credit_policy'`,
    );
    await queryRunner.query(`
      CREATE TYPE "public"."legal_acceptances_document_type_enum_new" AS ENUM(
        'terms', 'privacy', 'payment_refund', 'partner_terms', 'complaints'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "legal_acceptances"
      ALTER COLUMN "document_type"
      TYPE "public"."legal_acceptances_document_type_enum_new"
      USING "document_type"::text::"public"."legal_acceptances_document_type_enum_new"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."legal_acceptances_document_type_enum"`,
    );
    await queryRunner.query(`
      ALTER TYPE "public"."legal_acceptances_document_type_enum_new"
      RENAME TO "legal_acceptances_document_type_enum"
    `);

    /* --------------------------------------------------------- nội dung */
    await queryRunner.query(
      `DELETE FROM "faqs" WHERE "question_vi" = 'Point là gì?'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."legal_acceptances_document_type_enum_old" AS ENUM(
        'terms', 'privacy', 'payment_refund',
        'partner_terms', 'credit_policy', 'complaints'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "legal_acceptances"
      ALTER COLUMN "document_type"
      TYPE "public"."legal_acceptances_document_type_enum_old"
      USING "document_type"::text::"public"."legal_acceptances_document_type_enum_old"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."legal_acceptances_document_type_enum"`,
    );
    await queryRunner.query(`
      ALTER TYPE "public"."legal_acceptances_document_type_enum_old"
      RENAME TO "legal_acceptances_document_type_enum"
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."orders_payment_method_enum" AS ENUM('vnd', 'points')`,
    );
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD "payment_method" "public"."orders_payment_method_enum" NOT NULL DEFAULT 'vnd'
    `);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "payment_method" DROP DEFAULT`,
    );

    await queryRunner.query(
      `ALTER TABLE "tier_prices" ADD "repeat_points" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tier_prices" ADD "points" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_program_tiers" ADD "points" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "points" integer NOT NULL DEFAULT '0'`,
    );

    await queryRunner.query(`
      CREATE TABLE "point_top_ups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "store_id" uuid NOT NULL,
        "amount" integer NOT NULL,
        "unit_price" integer NOT NULL DEFAULT '0',
        "total_price" integer NOT NULL DEFAULT '0',
        "created_by_id" uuid,
        "note" character varying(500),
        CONSTRAINT "PK_point_top_ups" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."credit_transactions_type_enum" AS ENUM(
        'PURCHASE', 'PROMOTION', 'ADMIN_GRANT',
        'SPEND', 'REFUND', 'REVERSAL', 'ADJUSTMENT'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "credit_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "store_id" uuid NOT NULL,
        "type" "public"."credit_transactions_type_enum" NOT NULL,
        "amount" integer NOT NULL,
        "balance_after" integer NOT NULL,
        "reference" character varying(100),
        "reason" character varying(500),
        "created_by_id" uuid,
        CONSTRAINT "PK_credit_transactions" PRIMARY KEY ("id")
      )
    `);
  }
}
