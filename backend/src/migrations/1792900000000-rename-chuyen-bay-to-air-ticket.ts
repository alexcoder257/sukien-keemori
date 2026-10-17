import { MigrationInterface, QueryRunner } from 'typeorm';

/** Rename the catalog entry; the slug stays so existing links keep working. */
export class RenameChuyenBayToAirTicket1792900000000 implements MigrationInterface {
  name = 'RenameChuyenBayToAirTicket1792900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "name" = 'Air Ticket', "updated_at" = NOW()
      WHERE "slug" = 'chuyen-bay'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates"
      SET "name" = 'Chuyến Bay', "updated_at" = NOW()
      WHERE "slug" = 'chuyen-bay' AND "name" = 'Air Ticket'
    `);
  }
}
