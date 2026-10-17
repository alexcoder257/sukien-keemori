import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnhXuanTemplate1792210000000 implements MigrationInterface {
  name = 'AddAnhXuanTemplate1792210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "color_tones", "tags",
        "photo_slots", "image_position", "image_src", "sort_order"
      )
      SELECT
        'anh-xuan', 'Ánh Xuân', 'diamond',
        '{classic,luxury}', '{blue,white}', '{new}',
        '{cover,couple,groom,bride,story,closing}', '50% 0%',
        '/images/templates/anh-xuan/thumbnail.avif',
        COALESCE(MAX("sort_order"), -1) + 1
      FROM "templates"
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Preserve cards that already use this design.
  }
}
