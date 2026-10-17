import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gói Free đổi luật: link **vĩnh viễn, không trần người xem**, đổi lại không có
 * xác nhận tham dự và link mời riêng. Luật "3 ngày / 15 người xem" giờ chỉ là
 * bản dùng thử của Gold/Diamond chưa thanh toán.
 *
 * Kèm theo đó là trạng thái mới `free`: thiệp Free đã xuất bản không có khái
 * niệm đã/chưa thanh toán, nên nó không được mang `unpaid` — trạng thái đó
 * nghĩa là "bản dùng thử đang chờ trả tiền", và cả cron nhắc hạn lẫn cron
 * **xoá vĩnh viễn** đều chọn thiệp theo nó.
 *
 * Enum được **dựng lại** chứ không `ADD VALUE`: TypeORM chạy migration trong
 * một transaction, mà Postgres không cho dùng giá trị vừa `ADD VALUE` trước khi
 * transaction đó commit — tức bước chuyển hàng sang `free` ngay bên dưới sẽ
 * hỏng. Một type vừa `CREATE` thì dùng được ngay.
 *
 * Hàng cũ: thiệp Free đang `unpaid` chuyển sang `free`, và mất `expires_at`
 * lẫn `expiry_notified_at` — kể cả thiệp đã bị báo hết hạn mà chưa tới lượt
 * xoá. Không đụng `content`: cấu hình RSVP và link mời riêng đã lưu được giữ
 * nguyên để nâng gói là thấy lại, trang khách tự coi chúng như đang tắt.
 */
export class FreePlanPermanentLink1791600000000 implements MigrationInterface {
  name = 'FreePlanPermanentLink1791600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.rebuildStatusEnum(
      queryRunner,
      `'draft', 'free', 'unpaid', 'paid'`,
      `CASE WHEN "status"::text = 'unpaid' AND "plan_tier"::text = 'free'
         THEN 'free' ELSE "status"::text END`,
    );
    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "expires_at" = NULL,
          "expiry_notified_at" = NULL
      WHERE "status" = 'free'
    `);
  }

  /**
   * Trả thiệp `free` về `unpaid`. Hạn dùng không khôi phục được — không biết
   * hàng nào từng có hạn và hạn là bao nhiêu — nên thiệp Free cũ quay về
   * `unpaid` mà không có `expires_at`, tức vẫn không bị cron chạm tới.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.rebuildStatusEnum(
      queryRunner,
      `'draft', 'unpaid', 'paid'`,
      `CASE WHEN "status"::text = 'free' THEN 'unpaid' ELSE "status"::text END`,
    );
  }

  private async rebuildStatusEnum(
    queryRunner: QueryRunner,
    values: string,
    using: string,
  ): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."wedding_cards_status_enum" RENAME TO "wedding_cards_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wedding_cards_status_enum" AS ENUM(${values})`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" ALTER COLUMN "status" TYPE "public"."wedding_cards_status_enum" USING (${using})::"public"."wedding_cards_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wedding_cards_status_enum_old"`,
    );
  }
}
