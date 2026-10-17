import { MigrationInterface, QueryRunner } from 'typeorm';

/** Product decision: Vang Do is Diamond, retaining its three designed slots. */
export class SetVangDoDiamondTier1790900000000 implements MigrationInterface {
  name = 'SetVangDoDiamondTier1790900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "tier" = 'diamond'::"public"."templates_tier_enum",
          "updated_at" = NOW()
      WHERE "slug" = 'vang-do' AND "tier" <> 'diamond'
    `);
  }

  public async down(): Promise<void> {
    // Preserve the owner's tier choice rather than silently downgrading it.
  }
}
