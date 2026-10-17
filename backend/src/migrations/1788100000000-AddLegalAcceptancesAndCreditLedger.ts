import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hai bảng, cả hai đều là **sổ**: ghi thêm, không sửa, không xoá.
 *
 * 1. `legal_acceptances` — ai đã đồng ý văn bản nào, **phiên bản nào**, lúc
 *    nào. Khoá duy nhất là bộ ba `(user, document, version)` chứ không phải
 *    `(user, document)`: khi Điều khoản lên 2.0, hàng "user A đồng ý 1.0" phải
 *    còn nguyên. Không có cột IP/user-agent — chúng là dữ liệu cá nhân và
 *    Chính sách bảo mật hiện tại không mô tả việc lưu chúng cho mục đích này.
 *
 * 2. `credit_transactions` — sổ cái point của cửa hàng đối tác, **cả hai
 *    chiều**. Trước đây chỉ chiều nạp có sổ (`point_top_ups`), còn `spendPoints`
 *    chỉ `UPDATE partner_stores SET points = points - n`: số dư giảm mà không
 *    ai trả lời được vì sao. `point_top_ups` không bị thay thế — nó giữ đơn giá
 *    và thành tiền VND, tức dữ liệu kế toán; bảng này giữ dòng chảy số dư. Một
 *    lần nạp sinh hàng ở cả hai, nối nhau qua `reference`.
 */
export class AddLegalAcceptancesAndCreditLedger1788100000000 implements MigrationInterface {
  name = 'AddLegalAcceptancesAndCreditLedger1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."legal_acceptances_document_type_enum" AS ENUM(
        'terms', 'privacy', 'payment_refund',
        'partner_terms', 'credit_policy', 'complaints'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."legal_acceptances_source_enum" AS ENUM(
        'register', 'oauth', 'partner_onboarding', 'reconsent'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "legal_acceptances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "document_type" "public"."legal_acceptances_document_type_enum" NOT NULL,
        "document_version" character varying(16) NOT NULL,
        "source" "public"."legal_acceptances_source_enum" NOT NULL DEFAULT 'register',
        "accepted_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_legal_acceptances" PRIMARY KEY ("id"),
        CONSTRAINT "uq_legal_acceptances_user_doc_version"
          UNIQUE ("user_id", "document_type", "document_version")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_legal_acceptances_user" ON "legal_acceptances" ("user_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "legal_acceptances"
      ADD CONSTRAINT "FK_legal_acceptances_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
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
    await queryRunner.query(
      `CREATE INDEX "IDX_credit_transactions_store" ON "credit_transactions" ("store_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_credit_transactions_reference" ON "credit_transactions" ("reference")`,
    );
    await queryRunner.query(`
      ALTER TABLE "credit_transactions"
      ADD CONSTRAINT "FK_credit_transactions_store"
      FOREIGN KEY ("store_id") REFERENCES "partner_stores"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "credit_transactions"
      ADD CONSTRAINT "FK_credit_transactions_created_by"
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    /**
     * Backfill sổ cái từ lịch sử nạp đã có. Không backfill được chiều tiêu:
     * trước migration này không nơi nào ghi lại lượt trừ điểm, nên số dư hiện
     * tại là dữ liệu duy nhất còn đúng. Vì vậy `balance_after` của các hàng
     * backfill để bằng `amount` cộng dồn là **sai**, và đặt bằng số dư hiện tại
     * cũng sai — dùng `0` kèm `reason` nói rõ đây là dữ liệu dựng lại, để không
     * ai đọc nhầm nó thành số dư có thật tại thời điểm đó.
     */
    await queryRunner.query(`
      INSERT INTO "credit_transactions"
        ("store_id", "type", "amount", "balance_after", "reference", "reason", "created_by_id", "created_at")
      SELECT
        "store_id",
        CASE WHEN "unit_price" > 0 THEN 'PURCHASE'::"public"."credit_transactions_type_enum"
             ELSE 'ADMIN_GRANT'::"public"."credit_transactions_type_enum" END,
        "amount",
        0,
        'top_up:' || "id",
        'Dựng lại từ point_top_ups; số dư sau giao dịch không truy hồi được',
        "created_by_id",
        "created_at"
      FROM "point_top_ups"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "credit_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."credit_transactions_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "legal_acceptances"`);
    await queryRunner.query(
      `DROP TYPE "public"."legal_acceptances_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."legal_acceptances_document_type_enum"`,
    );
  }
}
