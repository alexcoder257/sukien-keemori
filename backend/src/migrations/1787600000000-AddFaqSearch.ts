import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tìm kiếm FAQ cho hộp chat hỗ trợ — hai thứ bảng `faqs` còn thiếu.
 *
 * `keywords_*` là **cách hỏi khác của khách**, không phải từ khoá SEO. Câu hỏi
 * trong FAQ được viết bằng ngôn ngữ sản phẩm ("Làm sao thành đối tác?") còn
 * khách gõ bằng ngôn ngữ của họ ("muốn bán thiệp cho khách của tiệm") — đo thử
 * thì đúng cặp này rơi từ hạng 1 xuống hạng 18. Một ô để người biên tập nhét
 * thêm vài cách nói chữa được chuyện đó rẻ hơn nhiều so với đổi thuật toán.
 * Cột **không** dùng để hiển thị, chỉ đi vào chỉ số tìm kiếm.
 *
 * `faq_queries` là sổ ghi những gì khách thật sự hỏi — đây mới là thứ nói cho
 * người biên tập biết nên viết thêm FAQ nào. Cố ý **không có `user_id`, không
 * có IP, không có session**: mục đích là đọc xu hướng câu hỏi chứ không phải
 * truy ra ai hỏi, nên thứ không cần thì không thu thập.
 *
 * `top_faq_id` dùng `ON DELETE SET NULL` chứ không CASCADE: xoá một FAQ không
 * được xoá mất bằng chứng rằng đã từng có người hỏi câu đó — đó chính là dữ
 * liệu cần để quyết định có viết lại FAQ đó không.
 */
export class AddFaqSearch1787600000000 implements MigrationInterface {
  name = 'AddFaqSearch1787600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "faqs" ADD "keywords_vi" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "faqs" ADD "keywords_en" text NOT NULL DEFAULT ''`,
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
        CONSTRAINT "PK_faq_queries" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "faq_queries" ADD CONSTRAINT "FK_faq_queries_top_faq" FOREIGN KEY ("top_faq_id") REFERENCES "faqs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    // Đường tra duy nhất của bảng này: "tuần vừa rồi khách hỏi gì".
    await queryRunner.query(
      `CREATE INDEX "IDX_faq_queries_created_at" ON "faq_queries" ("created_at")`,
    );
    // Lọc nhanh nhóm đáng chú ý nhất: câu không khớp được FAQ nào.
    await queryRunner.query(
      `CREATE INDEX "IDX_faq_queries_result_count" ON "faq_queries" ("result_count")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_faq_queries_result_count"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_faq_queries_created_at"`);
    await queryRunner.query(
      `ALTER TABLE "faq_queries" DROP CONSTRAINT "FK_faq_queries_top_faq"`,
    );
    await queryRunner.query(`DROP TABLE "faq_queries"`);
    await queryRunner.query(`ALTER TABLE "faqs" DROP COLUMN "keywords_en"`);
    await queryRunner.query(`ALTER TABLE "faqs" DROP COLUMN "keywords_vi"`);
  }
}
