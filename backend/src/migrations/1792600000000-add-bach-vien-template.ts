import { MigrationInterface, QueryRunner } from 'typeorm';

/** Publish the new design without overwriting existing CMS configuration. */
export class AddBachVienTemplate1792600000000 implements MigrationInterface {
  name = 'AddBachVienTemplate1792600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "color_tones", "tags",
        "photo_slots", "image_position", "image_src", "sort_order"
      )
      SELECT
        'bach-vien', 'Bạch Viên', 'diamond',
        '{classic,luxury}', '{white,brown}', '{new}',
        '{cover,groom,bride,couple,story,closing}', '50% 0%',
        '/images/templates/bach-vien/thumbnail.avif',
        COALESCE(MAX("sort_order"), -1) + 1
      FROM "templates"
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Invitations may already reference this template; retain their design.
  }
}
