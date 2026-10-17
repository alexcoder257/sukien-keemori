import type { MigrationInterface, QueryRunner } from 'typeorm';

// Frozen mapping: migrations must not depend on the mutable template seed.
const TEMPLATE_SLUGS = [
  ['traditional-red', 'do-truyen-thong'],
  ['nostalgic-hanoi', 'ha-noi-xua'],
  ['modern-classic', 'ca-phe'],
  ['garden-romance', 'vuon-hoa'],
  ['city-chic', 'dao-pho'],
  ['minimal-elegant', 'sen-trang'],
  ['timeless-classic', 'co-dien'],
  ['tulip', 'hoa-tulip'],
  ['hydrangea', 'hoa-cam-tu-cau'],
  ['lily', 'hoa-ly'],
  ['rose', 'hoa-hong'],
  ['daisy', 'hoa-cuc'],
] as const;

export class LocalizeDiamondTemplateSlugs1789800000000 implements MigrationInterface {
  name = 'LocalizeDiamondTemplateSlugs1789800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [previous, slug] of TEMPLATE_SLUGS) {
      await this.rename(queryRunner, previous, slug);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [previous, slug] of [...TEMPLATE_SLUGS].reverse()) {
      await this.rename(queryRunner, slug, previous);
    }
  }

  private async rename(
    queryRunner: QueryRunner,
    previous: string,
    slug: string,
  ): Promise<void> {
    // Preserve the template ID, CMS settings, card content and review IDs.
    // A slug collision must fail the transaction rather than merge products.
    await queryRunner.query(
      `UPDATE "templates"
       SET "slug" = $1,
           "image_src" = REPLACE("image_src", $3, $4)
       WHERE "slug" = $2`,
      [
        slug,
        previous,
        `/images/templates/${previous}/`,
        `/images/templates/${slug}/`,
      ],
    );
    // These references are strings, not foreign keys with ON UPDATE CASCADE.
    for (const table of ['wedding_cards', 'favorites', 'template_reviews']) {
      await queryRunner.query(
        `UPDATE "${table}" SET "template_slug" = $1 WHERE "template_slug" = $2`,
        [slug, previous],
      );
    }
  }
}
