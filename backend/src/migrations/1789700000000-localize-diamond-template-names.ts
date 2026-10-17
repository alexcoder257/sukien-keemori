import type { MigrationInterface, QueryRunner } from 'typeorm';

// Chỉ đổi các tên tiếng Anh gốc; giữ tên đã được biên tập riêng trong CMS.
const TEMPLATE_NAMES = [
  ['traditional-red', 'Traditional Red', 'Đỏ Truyền Thống'],
  ['nostalgic-hanoi', 'Nostalgic Hanoi', 'Hà Nội Xưa'],
  ['modern-classic', 'Modern Classic', 'Cà Phê'],
  ['garden-romance', 'Garden Romance', 'Vườn Hoa'],
  ['city-chic', 'City Chic', 'Dạo Phố'],
  ['minimal-elegant', 'Minimal Elegant', 'Sen Trắng'],
  ['timeless-classic', 'Timeless Classic', 'Cổ Điển'],
  ['tulip', 'Tulip', 'Hoa Tulip'],
  ['hydrangea', 'Hydrangea', 'Hoa Cẩm Tú Cầu'],
  ['lily', 'Lily', 'Hoa Ly'],
  ['rose', 'Rose', 'Hoa Hồng'],
  ['daisy', 'Daisy', 'Hoa Cúc'],
] as const;

export class LocalizeDiamondTemplateNames1789700000000 implements MigrationInterface {
  name = 'LocalizeDiamondTemplateNames1789700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [slug, previousName, name] of TEMPLATE_NAMES) {
      await queryRunner.query(
        `UPDATE "templates" SET "name" = $1
         WHERE "slug" = $2 AND "name" = $3 AND "tier" = 'diamond'`,
        [name, slug, previousName],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [slug, previousName, name] of TEMPLATE_NAMES) {
      await queryRunner.query(
        `UPDATE "templates" SET "name" = $1
         WHERE "slug" = $2 AND "name" = $3 AND "tier" = 'diamond'`,
        [previousName, slug, name],
      );
    }
  }
}
