import { MigrationInterface, QueryRunner } from 'typeorm';

/** Explicit catalog tier change requested by the owner; keep the three-slot layout. */
export class PromoteChuyenBayToDiamond1792700000000 implements MigrationInterface {
  name = 'PromoteChuyenBayToDiamond1792700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "tier" = 'diamond', "updated_at" = NOW()
      WHERE "slug" = 'chuyen-bay'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "tier" = 'gold', "updated_at" = NOW()
      WHERE "slug" = 'chuyen-bay' AND "tier" = 'diamond'
    `);
  }
}
