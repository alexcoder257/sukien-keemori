import { MigrationInterface, QueryRunner } from 'typeorm';

/** Insert the Song seaside scrapbook design without overwriting CMS metadata. */
export class AddSongTemplate1790200000000 implements MigrationInterface {
  name = 'AddSongTemplate1790200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "tags", "photo_slots",
        "image_position", "image_src", "sort_order"
      )
      SELECT 'song', 'Sóng', 'diamond'::"public"."templates_tier_enum",
        '{modern,minimal}'::"public"."templates_categories_enum"[],
        '{new}'::"public"."templates_tags_enum"[],
        '{cover,couple,story}'::character varying(20)[],
        '50% 0%', '/images/templates/song/thumbnail.avif',
        COALESCE((SELECT MAX("sort_order") FROM "templates"), -1) + 1
      WHERE NOT EXISTS (SELECT 1 FROM "templates" WHERE "slug" = 'song')
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Preserve this row: published invitations may reference the template.
  }
}
