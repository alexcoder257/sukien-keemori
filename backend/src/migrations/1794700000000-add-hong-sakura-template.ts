import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add Hồng Sakura while preserving the existing catalog and CMS choices.
 * Bốn ô ảnh: bìa, khung hoa cặp đôi, câu chuyện, save the date.
 */
export class AddHongSakuraTemplate1794700000000 implements MigrationInterface {
  name = 'AddHongSakuraTemplate1794700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "color_tones", "tags",
        "photo_slots", "image_position", "image_src", "sort_order"
      )
      SELECT
        'hong-sakura', 'Hồng Sakura', 'diamond',
        '{modern,luxury}', '{pink,white}', '{new}',
        '{cover,couple,story,closing}', '50% 0%',
        '/images/templates/hong-sakura/thumbnail.avif',
        COALESCE(MAX("sort_order"), -1) + 1
      FROM "templates"
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Keep references from wedding cards that have already selected this design.
  }
}
