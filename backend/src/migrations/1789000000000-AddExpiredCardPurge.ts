import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vòng đời cuối của một thiệp chưa thanh toán: hết hạn → báo cho chủ thiệp →
 * giữ thêm một thời gian → xoá vĩnh viễn cả hàng lẫn ảnh
 * (`src/cronjob/card-purge.cron.ts`).
 *
 * Ba thay đổi, mỗi cái cho một mắt xích:
 *
 * - `link_expired` là loại thông báo mới. Trước đây chỉ có `link_expiring` —
 *   lời nhắc **trước** hạn 24 giờ — nên người bỏ lỡ nó không bao giờ biết link
 *   đã chết, mà đó chính là người sắp bị xoá dữ liệu.
 * - `wedding_cards.expiry_notified_at` là mốc đếm ngược tới lúc xoá. `NULL`
 *   nghĩa là chưa báo, tức chưa được phép xoá: mọi hàng có sẵn vào `NULL` nên
 *   migration này **không** đặt thiệp cũ nào vào diện xoá, chúng phải đi qua
 *   một lượt báo tin trước đã.
 * - `site_settings.unpaid_purge_days` để vận hành chỉnh được cửa sổ chờ mà
 *   không phải deploy.
 *
 * `down` không gỡ được giá trị enum: Postgres không có `ALTER TYPE ... DROP
 * VALUE`. Hai cột thì gỡ được và có gỡ — xem ghi chú trong `down`.
 */
export class AddExpiredCardPurge1789000000000 implements MigrationInterface {
  name = 'AddExpiredCardPurge1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'link_expired'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" ADD COLUMN IF NOT EXISTS "expiry_notified_at" TIMESTAMP WITH TIME ZONE`,
    );
    // Job quét theo đúng hai cột này mỗi ngày; không có index thì mỗi lượt quét
    // là một seq scan trên bảng thiệp.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wedding_cards_expiry_notified_at" ON "wedding_cards" ("status", "expiry_notified_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "unpaid_purge_days" integer NOT NULL DEFAULT 5`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Giá trị enum `link_expired` ở lại — xem ghi chú đầu file. Những dòng
    // thông báo đã mang nó vẫn đọc được, nên đây là thứ vô hại nhất trong ba
    // thay đổi.
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "unpaid_purge_days"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wedding_cards_expiry_notified_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" DROP COLUMN IF EXISTS "expiry_notified_at"`,
    );
  }
}
