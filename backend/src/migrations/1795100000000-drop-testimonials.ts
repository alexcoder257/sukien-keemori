import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gỡ hẳn **lời chứng thực** ở trang chủ: khối "Cặp đôi nói gì về chúng tôi",
 * màn CMS và các route `/testimonials`, `/admin/testimonials`.
 *
 * Dữ liệu **mất hẳn** — `down` chỉ dựng lại cấu trúc bảng (gộp `InitSchema` và
 * `AddTestimonialSource`), viết thẳng ở đây chứ không gọi lại migration cũ.
 */
export class DropTestimonials1795100000000 implements MigrationInterface {
  name = 'DropTestimonials1795100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "testimonials"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "testimonials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "author" character varying(120) NOT NULL, "rating" smallint NOT NULL DEFAULT '5', "quote" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_published" boolean NOT NULL DEFAULT true, "platform" character varying(20), "author_role" character varying(10), CONSTRAINT "PK_63b03c608bd258f115a0a4a1060" PRIMARY KEY ("id"))`,
    );
  }
}
