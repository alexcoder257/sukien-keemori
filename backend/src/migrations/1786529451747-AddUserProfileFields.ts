import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1786529451747 implements MigrationInterface {
  name = 'AddUserProfileFields1786529451747';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email_notifications" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "allow_showcase" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "allow_showcase"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "email_notifications"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
  }
}
