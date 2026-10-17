import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Match the product slug and asset directory, keeping IDs and CMS settings. */
export class ChangeAirTicketTemplateSlug1793100000000 implements MigrationInterface {
  name = 'ChangeAirTicketTemplateSlug1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.rename(queryRunner, 'chuyen-bay', 'air-ticket');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.rename(queryRunner, 'air-ticket', 'chuyen-bay');
  }

  private async rename(
    queryRunner: QueryRunner,
    previous: string,
    slug: string,
  ): Promise<void> {
    // A collision must fail instead of merging distinct templates.
    await queryRunner.query(
      `UPDATE "templates"
       SET "slug" = $1,
           "image_src" = REPLACE("image_src", $3, $4),
           "updated_at" = NOW()
       WHERE "slug" = $2`,
      [
        slug,
        previous,
        `/images/templates/${previous}/`,
        `/images/templates/${slug}/`,
      ],
    );
    for (const table of ['wedding_cards', 'favorites', 'template_reviews']) {
      await queryRunner.query(
        `UPDATE "${table}" SET "template_slug" = $1 WHERE "template_slug" = $2`,
        [slug, previous],
      );
    }
  }
}
