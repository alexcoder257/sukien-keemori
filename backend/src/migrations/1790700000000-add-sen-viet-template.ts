import { MigrationInterface, QueryRunner } from 'typeorm';

/** Insert the Sen Viet lotus design without overwriting CMS metadata. */
export class AddSenVietTemplate1790700000000 implements MigrationInterface {
  name = 'AddSenVietTemplate1790700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "tags", "photo_slots",
        "image_position", "image_src", "sort_order"
      )
      SELECT 'sen-viet', 'Sen Việt', 'diamond'::"public"."templates_tier_enum",
        '{classic,traditional}'::"public"."templates_categories_enum"[],
        '{new}'::"public"."templates_tags_enum"[],
        '{cover,couple,story,closing}'::character varying(20)[],
        '50% 0%', '/images/templates/sen-viet/thumbnail.avif',
        COALESCE((SELECT MAX("sort_order") FROM "templates"), -1) + 1
      WHERE NOT EXISTS (SELECT 1 FROM "templates" WHERE "slug" = 'sen-viet')
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Preserve this row: published invitations may reference the template.
  }
}
