import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rút cửa sổ giữ thiệp chưa thanh toán sau khi hết hạn từ 5 ngày xuống 1 ngày
 * (Điều khoản sử dụng 6.0 mục 3, Chính sách bảo mật 4.0 mục 13).
 *
 * Chỉ ghi đè hàng còn đúng giá trị mặc định cũ (5): nếu vận hành đã tự chỉnh
 * con số trong CMS thì đó là quyết định của họ, migration không giẫm lên.
 *
 * Có hiệu lực ngay với thiệp đang chờ xoá — `purgeExpired` đọc số ngày lúc
 * chạy. Thiệp đã được báo hết hạn từ hơn một ngày trước sẽ bị xoá ở lượt cron
 * kế tiếp; những người đó đã nhận thư ghi mốc 5 ngày, nên deploy migration này
 * là một quyết định có chủ ý, không phải việc dọn dẹp.
 */
export class ShortenUnpaidPurgeWindow1792000000000 implements MigrationInterface {
  name = 'ShortenUnpaidPurgeWindow1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "unpaid_purge_days" SET DEFAULT 1`,
    );
    await queryRunner.query(
      `UPDATE "site_settings" SET "unpaid_purge_days" = 1 WHERE "unpaid_purge_days" = 5`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "unpaid_purge_days" SET DEFAULT 5`,
    );
    await queryRunner.query(
      `UPDATE "site_settings" SET "unpaid_purge_days" = 5 WHERE "unpaid_purge_days" = 1`,
    );
  }
}
