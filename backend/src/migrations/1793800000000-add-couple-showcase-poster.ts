import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ô trưng bày "Cặp đôi đã tạo thiệp" mang ảnh bìa riêng (`poster_src`) bên
 * cạnh ảnh chụp dài (`image_src`), để người vận hành tải lên cả hai cho thiệp
 * của khách. Hàng cũ để `NULL`: chúng đang trỏ vào `thumbnail.avif` của kho mẫu
 * và frontend vẫn suy ra `poster.avif` như trước.
 */
export class AddCoupleShowcasePoster1793800000000 implements MigrationInterface {
  name = 'AddCoupleShowcasePoster1793800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "couple_showcases" ADD "poster_src" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "couple_showcases" DROP COLUMN "poster_src"`,
    );
  }
}
