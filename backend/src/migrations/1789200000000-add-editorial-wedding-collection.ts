import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add the seven editorial designs without overwriting CMS decisions or existing cards. */
export class AddEditorialWeddingCollection1789200000000 implements MigrationInterface {
  name = 'AddEditorialWeddingCollection1789200000000';

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
        (1, 'traditional-red', 'Traditional Red', '{traditional,formal}', '/images/templates/traditional-red/thumbnail.avif'),
        (2, 'nostalgic-hanoi', 'Nostalgic Hanoi', '{classic,formal}', '/images/templates/nostalgic-hanoi/thumbnail.avif'),
        (3, 'modern-classic', 'Modern Classic', '{modern,formal}', '/images/templates/modern-classic/thumbnail.avif'),
        (4, 'garden-romance', 'Garden Romance', '{classic,formal}', '/images/templates/garden-romance/thumbnail.avif'),
        (5, 'city-chic', 'City Chic', '{modern,formal}', '/images/templates/city-chic/thumbnail.avif'),
        (6, 'minimal-elegant', 'Minimal Elegant', '{minimal,formal}', '/images/templates/minimal-elegant/thumbnail.avif'),
        (7, 'timeless-classic', 'Timeless Classic', '{luxury,formal}', '/images/templates/timeless-classic/thumbnail.avif')
      ) AS v("ord", "slug", "name", "categories", "image_src")
      WHERE NOT EXISTS (SELECT 1 FROM "templates" t WHERE t."slug" = v."slug")
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // A created invitation can reference a design immediately. Preserve catalog rows on rollback.
  }
}
