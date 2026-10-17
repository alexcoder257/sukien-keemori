import { MigrationInterface, QueryRunner } from 'typeorm';

/** Layout-owned fields only; the Diamond tier is selected through the CMS. */
export class AddSuLamPhotoSlots1794000000000 implements MigrationInterface {
  name = 'AddSuLamPhotoSlots1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "photo_slots" = '{couple,story,closing}'
      WHERE "slug" = 'su-lam'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates" SET "photo_slots" = '{}'
      WHERE "slug" = 'su-lam'
        AND "photo_slots" = '{couple,story,closing}'
    `);
  }
}
