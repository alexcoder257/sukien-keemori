import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds the burgundy theatre and ivory lace design; preserves existing CMS data. */
export class AddDaVuTemplate1792500000000 implements MigrationInterface {
  name = 'AddDaVuTemplate1792500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "color_tones", "tags", "photo_slots",
        "image_position", "image_src", "sort_order"
      )
      SELECT 'da-vu', 'Dạ Vũ', 'diamond'::"public"."templates_tier_enum",
        '{luxury,classic}'::"public"."templates_categories_enum"[],
        '{red,white}'::"public"."templates_color_tones_enum"[],
        '{new}'::"public"."templates_tags_enum"[],
        '{cover,couple,groom,bride,story,closing}'::character varying(20)[],
        '50% 0%', '/images/templates/da-vu/thumbnail.avif',
        COALESCE((SELECT MAX("sort_order") FROM "templates"), -1) + 1
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Keep the row because saved invitations may already reference this design.
  }
}
