import { MigrationInterface, QueryRunner } from 'typeorm';

/** Keep the catalog color filter aligned with the owner's navy redesign. */
export class SetChuyenBayNavyColors1792800000000 implements MigrationInterface {
  name = 'SetChuyenBayNavyColors1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "color_tones" = '{white,blue}', "updated_at" = NOW()
      WHERE "slug" = 'chuyen-bay'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "color_tones" = '{white,brown}', "updated_at" = NOW()
      WHERE "slug" = 'chuyen-bay' AND "color_tones" = '{white,blue}'
    `);
  }
}
