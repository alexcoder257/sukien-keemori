import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Nhãn "được chọn nhiều nhất" cho thẻ Diamond Song Hỷ ở trang bảng giá.
 *
 * Chỉ thêm cột, mặc định `false`: cờ này là dữ liệu **CMS làm chủ** (admin bật
 * ở `/bang-gia`), nên migration không chọn hộ thẻ nào — chọn ở đây là ghi đè
 * quyết định của vận hành mỗi lần dựng lại database.
 */
export class AddFamilySplitHighlighted1793400000000 implements MigrationInterface {
  name = 'AddFamilySplitHighlighted1793400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tier_prices" ADD COLUMN "family_split_highlighted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tier_prices" DROP COLUMN "family_split_highlighted"`,
    );
  }
}
