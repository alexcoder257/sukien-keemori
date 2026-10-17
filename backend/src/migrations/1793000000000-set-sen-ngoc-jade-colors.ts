import { MigrationInterface, QueryRunner } from 'typeorm';

/** Moon-gate redesign: white paper and jade green, not blue. */
export class SetSenNgocJadeColors1793000000000 implements MigrationInterface {
  name = 'SetSenNgocJadeColors1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "color_tones" = '{white,green}', "updated_at" = NOW()
      WHERE "slug" = 'sen-ngoc'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "color_tones" = '{white,blue}', "updated_at" = NOW()
      WHERE "slug" = 'sen-ngoc' AND "color_tones" = '{white,green}'
    `);
  }
}
