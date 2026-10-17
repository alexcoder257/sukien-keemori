import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gỡ trợ lý chat Mori: bỏ hàng đợi câu hỏi không trả lời được
 * (`mori_unanswered_questions`, dựng ở `CreateMoriUnansweredQuestions`).
 *
 * Bảng không có khoá ngoại vào hay ra, nên `DROP` không kéo theo bảng nào.
 * `down` dựng lại đúng schema cũ nhưng **không** lấy lại được dữ liệu — câu
 * hỏi đã lưu mất hẳn khi `up` chạy.
 *
 * Định nghĩa bảng viết thẳng ở đây chứ không gọi lại migration cũ: migration
 * là lát cắt đông cứng, không phụ thuộc vào file nào còn có thể bị sửa.
 */
export class DropMoriUnansweredQuestions1794800000000 implements MigrationInterface {
  name = 'DropMoriUnansweredQuestions1794800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mori_unanswered_questions"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "mori_unanswered_questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "question" text NOT NULL,
        "question_key" character varying(255) NOT NULL,
        "context" text,
        "reason" character varying(20) NOT NULL,
        "top_score" real,
        "top_chunk_id" character varying(255),
        "ask_count" integer NOT NULL DEFAULT '1',
        "last_asked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "status" character varying(20) NOT NULL DEFAULT 'open',
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_mori_unanswered_questions" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_mori_unanswered_questions_reason"
          CHECK ("reason" IN ('low_score', 'model_fallback')),
        CONSTRAINT "CHK_mori_unanswered_questions_status"
          CHECK ("status" IN ('open', 'resolved', 'ignored'))
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_mori_unanswered_questions_question_key" ON "mori_unanswered_questions" ("question_key")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mori_unanswered_questions_last_asked_at" ON "mori_unanswered_questions" ("last_asked_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mori_unanswered_questions_status" ON "mori_unanswered_questions" ("status")`,
    );
  }
}
