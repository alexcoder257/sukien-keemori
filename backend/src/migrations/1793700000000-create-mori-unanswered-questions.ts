import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hàng đợi câu hỏi Mori không trả lời được (`mori_unanswered_questions`).
 *
 * Không khoá ngoại nào và không cột nào định danh người hỏi: bảng chỉ giữ chữ
 * của câu hỏi (đã che email/số điện thoại), được gom theo `question_key`.
 * `status`/`reason` là varchar + CHECK chứ không phải enum Postgres — thêm một
 * giá trị sau này là sửa CHECK, không phải `ALTER TYPE ... ADD VALUE` không
 * hoàn tác được.
 */
export class CreateMoriUnansweredQuestions1793700000000 implements MigrationInterface {
  name = 'CreateMoriUnansweredQuestions1793700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "mori_unanswered_questions"`);
  }
}
