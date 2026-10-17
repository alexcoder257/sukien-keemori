import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add Sen Ngoc while preserving the existing catalog and CMS choices. */
export class AddSenNgocTemplate1792300000000 implements MigrationInterface {
  name = 'AddSenNgocTemplate1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "color_tones", "tags",
        "photo_slots", "image_position", "image_src", "sort_order"
      )
      SELECT
        'sen-ngoc', 'Sen Ngọc', 'diamond',
        '{classic,traditional}', '{white,blue}', '{new}',
        '{cover,couple,groom,bride,story,closing}', '50% 0%',
        '/images/templates/sen-ngoc/thumbnail.avif',
        COALESCE(MAX("sort_order"), -1) + 1
      FROM "templates"
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Keep references from wedding cards that have already selected this design.
  }
}
