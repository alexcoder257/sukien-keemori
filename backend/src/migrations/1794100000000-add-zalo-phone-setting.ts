import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Số Zalo liên hệ ở chân trang, trang Liên hệ và trang Thông tin doanh
 * nghiệp, chỉnh được trong CMS.
 *
 * Để `NULL`, không backfill — cùng lý do với `AddFooterSocialSettings`:
 * `null` nghĩa là "chưa cấu hình", và điền sẵn một số ở đây là đóng băng một
 * lựa chọn thành thứ trông như người vận hành đã bấm. Sau deploy, nhập số ở
 * màn Cài đặt của CMS.
 */
export class AddZaloPhoneSetting1794100000000 implements MigrationInterface {
  name = 'AddZaloPhoneSetting1794100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "zalo_phone" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "zalo_phone"`,
    );
  }
}
