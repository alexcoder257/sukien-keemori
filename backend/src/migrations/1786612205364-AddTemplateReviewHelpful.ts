import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lượt "Hữu ích" trên đánh giá mẫu thiệp.
 *
 * Một hàng cho mỗi cặp (người bấm, đánh giá): `UQ` là chỗ thực thi "mỗi người
 * một lượt", còn `ON DELETE CASCADE` dọn sạch khi đánh giá gốc hoặc tài khoản
 * biến mất — một lượt hữu ích mồ côi không có nghĩa gì.
 */
export class AddTemplateReviewHelpful1786612205364 implements MigrationInterface {
  name = 'AddTemplateReviewHelpful1786612205364';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "template_review_helpful" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "review_id" uuid NOT NULL, CONSTRAINT "UQ_a69a82fd3feaa203c091ea45144" UNIQUE ("user_id", "review_id"), CONSTRAINT "PK_21693d8686eba38a5168b41e9f1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_574210313ebec72290244737c0" ON "template_review_helpful"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b1b25bf97ea2b63df41a2d05bd" ON "template_review_helpful"  ("review_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "template_review_helpful" ADD CONSTRAINT "FK_574210313ebec72290244737c0e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_review_helpful" ADD CONSTRAINT "FK_b1b25bf97ea2b63df41a2d05bdd" FOREIGN KEY ("review_id") REFERENCES "template_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template_review_helpful" DROP CONSTRAINT "FK_b1b25bf97ea2b63df41a2d05bdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_review_helpful" DROP CONSTRAINT "FK_574210313ebec72290244737c0e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b1b25bf97ea2b63df41a2d05bd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_574210313ebec72290244737c0"`,
    );
    await queryRunner.query(`DROP TABLE "template_review_helpful"`);
  }
}
