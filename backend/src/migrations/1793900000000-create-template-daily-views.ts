import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lượt xem mẫu trong kho, gộp theo ngày — nguồn của màn "Mẫu xem nhiều" trong
 * CMS. Bảng mới hoàn toàn, không đụng dữ liệu cũ; số liệu bắt đầu từ lúc deploy.
 */
export class CreateTemplateDailyViews1793900000000 implements MigrationInterface {
  name = 'CreateTemplateDailyViews1793900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "template_daily_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "day" date NOT NULL, "template_slug" character varying(60) NOT NULL, "open_views" integer NOT NULL DEFAULT '0', "demo_views" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_template_daily_views" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_template_daily_views_day_slug" ON "template_daily_views" ("day", "template_slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_template_daily_views_day_slug"`,
    );
    await queryRunner.query(`DROP TABLE "template_daily_views"`);
  }
}
