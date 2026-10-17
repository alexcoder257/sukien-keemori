import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add the new design without changing any existing CMS choices. */
export class AddChuyenBayTemplate1792200000000 implements MigrationInterface {
  name = 'AddChuyenBayTemplate1792200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "color_tones", "tags",
        "photo_slots", "image_position", "image_src", "sort_order"
      )
      SELECT
        'chuyen-bay', 'Chuyến Bay', 'gold',
        '{classic,modern}', '{white,brown}', '{new}',
        '{cover,couple,closing}', '50% 0%',
        '/images/templates/chuyen-bay/thumbnail.avif',
        COALESCE(MAX("sort_order"), -1) + 1
      FROM "templates"
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // A design can already be selected by wedding cards; keep their reference.
  }
}
