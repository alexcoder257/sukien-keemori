import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Soft delete tài khoản từ CMS. Cột `deleted_at` phải nullable và **không** có
 * index unique nào đi kèm: unique index của `email` giữ nguyên trên toàn bộ
 * bảng, đó chính là thứ chặn đăng ký lại bằng email đã bị xoá.
 */
export class AddUserSoftDelete1786700000000 implements MigrationInterface {
  name = 'AddUserSoftDelete1786700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
  }
}
