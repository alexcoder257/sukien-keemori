import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add package-5 designs; preserve catalog metadata already owned by CMS. */
export class AddFloralWeddingCollection1789300000000 implements MigrationInterface {
  name = 'AddFloralWeddingCollection1789300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "tags", "photo_slots",
        "image_position", "image_src", "sort_order"
      )
      SELECT v."slug", v."name", 'diamond'::"public"."templates_tier_enum",
        v."categories"::"public"."templates_categories_enum"[],
        '{new}'::"public"."templates_tags_enum"[],
        '{cover,couple,story,closing}'::character varying(20)[],
        '50% 0%', v."image_src",
        COALESCE((SELECT MAX("sort_order") FROM "templates"), -1)
          + ROW_NUMBER() OVER (ORDER BY v."ord")
      FROM (VALUES
        (1, 'tulip', 'Tulip', '{classic,formal}', '/images/templates/tulip/thumbnail.avif'),
        (2, 'hydrangea', 'Hydrangea', '{classic,formal}', '/images/templates/hydrangea/thumbnail.avif'),
        (3, 'lily', 'Lily', '{minimal,formal}', '/images/templates/lily/thumbnail.avif'),
        (4, 'rose', 'Rose', '{luxury,formal}', '/images/templates/rose/thumbnail.avif'),
        (5, 'daisy', 'Daisy', '{minimal,formal}', '/images/templates/daisy/thumbnail.avif')
      ) AS v("ord", "slug", "name", "categories", "image_src")
      WHERE NOT EXISTS (SELECT 1 FROM "templates" t WHERE t."slug" = v."slug")
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Existing invitations may already reference these rows. Preserve them.
  }
}
