import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Rename the product in place, preserving cards, favorites and reviews. */
export class RenameVangDoToDoBurgundy1791000000000 implements MigrationInterface {
  name = 'RenameVangDoToDoBurgundy1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.rename(queryRunner, 'vang-do', 'do-burgundy', 'Đỏ Burgundy');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.rename(queryRunner, 'do-burgundy', 'vang-do', 'Vang Đỏ');
  }

  private async rename(
    queryRunner: QueryRunner,
    previous: string,
    slug: string,
    name: string,
  ): Promise<void> {
    // Keep IDs and CMS settings. A slug collision fails rather than merging
    // distinct products. Earlier migrations remain frozen for existing DBs.
    await queryRunner.query(
      `UPDATE "templates"
       SET "slug" = $1, "name" = $3,
           "image_src" = REPLACE("image_src", $4, $5),
           "updated_at" = NOW()
       WHERE "slug" = $2`,
      [
        slug,
        previous,
        name,
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
