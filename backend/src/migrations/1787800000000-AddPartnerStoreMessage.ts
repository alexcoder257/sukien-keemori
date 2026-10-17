import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lời nhắn kèm đơn xin làm đối tác.
 *
 * Form nộp đơn ở màn thanh toán chỉ hỏi số điện thoại và một ô lời nhắn — đó
 * là toàn bộ thứ admin cần trước khi gọi lại. Nullable vì cửa hàng do admin
 * tạo thẳng không đi qua bước nộp đơn nên không có lời nhắn nào để lưu.
 */
export class AddPartnerStoreMessage1787800000000 implements MigrationInterface {
  name = 'AddPartnerStoreMessage1787800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD "message" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP COLUMN "message"`,
    );
  }
}
