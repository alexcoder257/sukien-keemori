import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gỡ hộp chat hỗ trợ khỏi cơ sở dữ liệu.
 *
 * Ba thứ đi cùng nhau vì cả ba chỉ phục vụ đúng một tính năng đã bị gỡ:
 * `faq_queries` là sổ câu hỏi khách gõ vào hộp chat, còn `faqs.keywords_*` là
 * "cách hỏi khác của khách" — cột **chưa bao giờ được hiển thị**, nó chỉ đi vào
 * chỉ số BM25 của `FaqSearchService`. Không còn ô nhập câu hỏi thì không còn gì
 * ghi vào bảng và không còn gì đọc hai cột đó.
 *
 * FAQ **bản thân nó vẫn còn**: khối FAQ trang chủ và màn soạn FAQ trong CMS
 * không liên quan gì tới hộp chat.
 *
 * `down` dựng lại đủ cấu trúc nhưng **không lấy lại được dữ liệu** — bảng log
 * đã đi cùng `DROP TABLE`. Đây là quyết định có chủ đích, không phải sơ suất.
 */
export class RemoveFaqChatbot1788600000000 implements MigrationInterface {
  name = 'RemoveFaqChatbot1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "faq_queries"`);
    await queryRunner.query(
      `ALTER TABLE "faqs" DROP COLUMN IF EXISTS "keywords_vi"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faqs" DROP COLUMN IF EXISTS "keywords_en"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "faqs" ADD "keywords_en" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "faqs" ADD "keywords_vi" text NOT NULL DEFAULT ''`,
    );

    await queryRunner.query(
      `CREATE TABLE "faq_queries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "question" character varying(300) NOT NULL,
        "locale" character varying(2) NOT NULL,
        "top_faq_id" uuid,
        "top_score" real NOT NULL DEFAULT 0,
        "result_count" integer NOT NULL DEFAULT 0,
        "answered_directly" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_faq_queries" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "faq_queries" ADD CONSTRAINT "FK_faq_queries_top_faq" FOREIGN KEY ("top_faq_id") REFERENCES "faqs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_faq_queries_created_at" ON "faq_queries" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_faq_queries_result_count" ON "faq_queries" ("result_count")`,
    );
  }
}
