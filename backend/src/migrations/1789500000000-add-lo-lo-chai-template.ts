import { MigrationInterface, QueryRunner } from 'typeorm';

/** Insert the Lo Lo Chai scrapbook design without overwriting CMS metadata. */
export class AddLoLoChaiTemplate1789500000000 implements MigrationInterface {
  name = 'AddLoLoChaiTemplate1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "tags", "photo_slots",
        "image_position", "image_src", "sort_order"
      )
      SELECT 'lo-lo-chai', 'Lô Lô Chải', 'diamond'::"public"."templates_tier_enum",
        '{classic,traditional}'::"public"."templates_categories_enum"[],
        '{new}'::"public"."templates_tags_enum"[],
        '{cover,couple,story,closing}'::character varying(20)[],
        '50% 0%', '/images/templates/lo-lo-chai/thumbnail.avif',
        COALESCE((SELECT MAX("sort_order") FROM "templates"), -1) + 1
      WHERE NOT EXISTS (SELECT 1 FROM "templates" WHERE "slug" = 'lo-lo-chai')
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Preserve this row: published invitations may reference the template.
  }
}
