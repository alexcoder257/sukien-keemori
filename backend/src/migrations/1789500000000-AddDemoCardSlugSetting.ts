import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Nút "Xem thiệp mẫu" ở hero trang chủ trỏ vào một slug **cứng trong code**
 * (`DEMO_INVITATION_SLUG` của frontend). Đổi thiệp đem ra chào hàng là quyết
 * định biên tập, đổi theo đợt, nên nó thuộc về `site_settings` chứ không thuộc
 * về một lần deploy.
 *
 * Cột để `NULL` chứ không backfill giá trị cũ: `null` nghĩa là "chưa cấu hình",
 * và frontend rơi về đúng hằng số đang chạy. Backfill ở đây sẽ đóng băng lựa
 * chọn hiện tại thành một quyết định trông như đã được người vận hành bấm.
 */
export class AddDemoCardSlugSetting1789500000000 implements MigrationInterface {
  name = 'AddDemoCardSlugSetting1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "demo_card_slug" character varying(60)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "demo_card_slug"`,
    );
  }
}
