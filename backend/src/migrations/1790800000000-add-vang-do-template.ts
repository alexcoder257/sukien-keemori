import { MigrationInterface, QueryRunner } from 'typeorm';

/** Insert the Vang Do burgundy calla design without overwriting CMS metadata. */
export class AddVangDoTemplate1790800000000 implements MigrationInterface {
  name = 'AddVangDoTemplate1790800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "tags", "photo_slots",
        "image_position", "image_src", "sort_order"
      )
      SELECT 'vang-do', 'Vang Đỏ', 'diamond'::"public"."templates_tier_enum",
        '{luxury,classic}'::"public"."templates_categories_enum"[],
        '{new}'::"public"."templates_tags_enum"[],
        '{cover,couple,story}'::character varying(20)[],
        '50% 0%', '/images/templates/vang-do/thumbnail.avif',
        COALESCE((SELECT MAX("sort_order") FROM "templates"), -1) + 1
      WHERE NOT EXISTS (SELECT 1 FROM "templates" WHERE "slug" = 'vang-do')
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Preserve this row: published invitations may reference the template.
  }
}
