import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Link Messenger của fanpage cho nút chat nổi ở trang khách.
 *
 * Cột `NULL` được, không có giá trị mặc định: chưa ai điền thì frontend không
 * vẽ nút. Một mặc định kiểu `''` chỉ đẩy việc phân biệt "chưa cấu hình" xuống
 * cho từng chỗ đọc.
 */
export class AddMessengerUrlToSettings1787400000000 implements MigrationInterface {
  name = 'AddMessengerUrlToSettings1787400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD "messenger_url" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN "messenger_url"`,
    );
  }
}
