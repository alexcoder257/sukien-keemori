import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ghi lại **hộp chat có tự trả lời hay không** cho từng câu hỏi.
 *
 * Đây là cột để kiểm chứng lại chính luật tự trả lời trên dữ liệu thật. Luật đó
 * (tỉ lệ điểm hạng1/hạng2 và tỉ lệ từ khoá khớp được) được chốt bằng một bộ 29
 * câu hỏi tự nghĩ ra: đủ để tin là hướng đúng, không đủ để tin con số. Không có
 * cột này thì không có cách nào biết nó sai bao nhiêu phần trên câu hỏi thật.
 *
 * `false` cho hàng cũ là đúng nghĩa chứ không phải giá trị lấp chỗ: trước
 * migration này hộp chat chưa bao giờ tự trả lời.
 */
export class AddFaqQueryAnsweredDirectly1787700000000 implements MigrationInterface {
  name = 'AddFaqQueryAnsweredDirectly1787700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "faq_queries" ADD "answered_directly" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "faq_queries" DROP COLUMN "answered_directly"`,
    );
  }
}
