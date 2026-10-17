import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema cho các màn CMS còn thiếu: lưu lượng truy cập (`daily_visits`), khoản
 * chi (`expenses`), sổ nạp point (`point_top_ups`), cùng ba cột cấu hình trang
 * chủ: mẫu nào lên trang chủ, thứ tự của chúng, và thiệp nào được trưng bày.
 *
 * Không đụng tới bảng `users`: cột Google OAuth thuộc về
 * `AddGoogleOAuthToUser1786419600000` và migration đó vẫn đang chờ chạy —
 * `migration:generate` diff với DB **thật**, nên nó gộp luôn phần chưa chạy vào
 * file này; đã gỡ bằng tay để hai migration không cùng thêm một cột.
 */
export class AddCmsAdminFeatures1786437156703 implements MigrationInterface {
  name = 'AddCmsAdminFeatures1786437156703';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "daily_visits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "day" date NOT NULL, "page_views" integer NOT NULL DEFAULT '0', "visitors" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_a2ee7e07f99d1be9fd8d81e3a40" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e89311c1d836af0512054c755b" ON "daily_visits"  ("day") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."expenses_category_enum" AS ENUM('hosting', 'marketing', 'salary', 'tooling', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "label" character varying(200) NOT NULL, "category" "public"."expenses_category_enum" NOT NULL DEFAULT 'other', "amount" integer NOT NULL, "incurred_at" date NOT NULL, "is_recurring_monthly" boolean NOT NULL DEFAULT false, "note" character varying(500), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_470444e61950aaeff6e87dc114" ON "expenses"  ("incurred_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "point_top_ups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "store_id" uuid NOT NULL, "amount" integer NOT NULL, "unit_price" integer NOT NULL DEFAULT '0', "total_price" integer NOT NULL DEFAULT '0', "created_by_id" uuid, "note" character varying(500), CONSTRAINT "PK_eba5fccbee877b824a7f3d3adf9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_849bcd1d7037a64d215b1294eb" ON "point_top_ups"  ("store_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" ADD "showcased_on_home" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ADD "featured_on_home" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ADD "homepage_order" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD "homepage_template_count" integer NOT NULL DEFAULT '6'`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_top_ups" ADD CONSTRAINT "FK_849bcd1d7037a64d215b1294ebb" FOREIGN KEY ("store_id") REFERENCES "partner_stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_top_ups" ADD CONSTRAINT "FK_3ea21933483fa730176b433f1a6" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "point_top_ups" DROP CONSTRAINT "FK_3ea21933483fa730176b433f1a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_top_ups" DROP CONSTRAINT "FK_849bcd1d7037a64d215b1294ebb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN "homepage_template_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" DROP COLUMN "homepage_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" DROP COLUMN "featured_on_home"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" DROP COLUMN "showcased_on_home"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_849bcd1d7037a64d215b1294eb"`,
    );
    await queryRunner.query(`DROP TABLE "point_top_ups"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_470444e61950aaeff6e87dc114"`,
    );
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_category_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e89311c1d836af0512054c755b"`,
    );
    await queryRunner.query(`DROP TABLE "daily_visits"`);
  }
}
