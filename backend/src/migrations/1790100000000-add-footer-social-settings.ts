import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Link mạng xã hội (Facebook, Instagram, TikTok) và email ở chân trang khách,
 * chỉnh được trong CMS.
 *
 * Bốn cột để `NULL`, không backfill — cùng lý do với
 * `AddDemoCardSlugSetting`: `null` nghĩa là "chưa cấu hình" và frontend ẩn
 * biểu tượng đó. Điền sẵn một địa chỉ ở đây là đóng băng một lựa chọn thành thứ
 * trông như người vận hành đã bấm.
 */
export class AddFooterSocialSettings1790100000000 implements MigrationInterface {
  name = 'AddFooterSocialSettings1790100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "facebook_url" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "instagram_url" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "tiktok_url" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "contact_email" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "contact_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "tiktok_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "instagram_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "facebook_url"`,
    );
  }
}
