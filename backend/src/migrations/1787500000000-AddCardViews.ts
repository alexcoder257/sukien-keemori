import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đếm **khách** thay vì đếm lượt tải trang cho trần 15 của link chưa thanh toán.
 *
 * Không backfill được: trước bảng này chỉ có `wedding_cards.view_count` là một
 * con số cộng dồn, không lưu ai đã xem, nên không có cách nào tách nó ra thành
 * từng người. Vì vậy `view_count` của thiệp cũ được **giữ nguyên** — nó là số
 * lượt tải trang trong lịch sử — và từ đây trở đi mỗi lần cộng thêm là một
 * khách mới. Thiệp đang chạy dở sẽ nghiêm hơn thực tế một chút; đặt lại về 0 thì
 * ngược lại là mở rộng trần cho link đã phát ra ngoài, tệ hơn nhiều.
 *
 * `ON DELETE CASCADE`: xoá thiệp thì lịch sử người xem của nó cũng hết ý nghĩa.
 */
export class AddCardViews1787500000000 implements MigrationInterface {
  name = 'AddCardViews1787500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "card_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "card_id" uuid NOT NULL,
        "visitor_id" character varying(64) NOT NULL,
        CONSTRAINT "PK_card_views" PRIMARY KEY ("id")
      )`,
    );
    // Unique chứ không phải index thường: đây vừa là đường tra "khách này đã
    // được tính chưa", vừa là thứ giữ cho hai request song song của cùng một
    // khách không thành hai hàng.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_card_views_card_visitor" ON "card_views" ("card_id", "visitor_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_views" ADD CONSTRAINT "FK_card_views_card" FOREIGN KEY ("card_id") REFERENCES "wedding_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "card_views" DROP CONSTRAINT "FK_card_views_card"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_card_views_card_visitor"`,
    );
    await queryRunner.query(`DROP TABLE "card_views"`);
  }
}
