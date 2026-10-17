import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Link mời riêng cho từng khách: bảng `card_guests` giữ mã link, còn cờ bật và
 * nguyên văn danh sách nằm trong `content.guestInvite` của thiệp.
 *
 * Unique theo `(card_id, token)` chứ không theo `token` trơn: link luôn mang
 * slug của thiệp, nên mã chỉ cần duy nhất trong phạm vi một thiệp.
 *
 * Backfill `guestInvite` cho mọi thiệp đã có: `InvitationContentDto` đòi đủ
 * khoá, nên thiệp cũ thiếu khoá này sẽ không lưu lại được từ editor. Giá trị
 * viết thẳng ở đây (tắt, danh sách rỗng) chứ không `import` từ
 * `empty-content.ts` — migration là lát cắt đông cứng của thời gian. Chỉ ghi
 * vào hàng **chưa có** khoá, để chạy lại trên một database đã có dữ liệu thật
 * không tắt mất tính năng người ta vừa bật.
 */
export class AddCardGuests1790400000000 implements MigrationInterface {
  name = 'AddCardGuests1790400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "card_guests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "card_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "token" character varying(16) NOT NULL,
        "position" integer NOT NULL,
        CONSTRAINT "PK_card_guests" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_card_guests_card_token" ON "card_guests" ("card_id", "token")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_card_guests_card" ON "card_guests" ("card_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_guests" ADD CONSTRAINT "FK_card_guests_card" FOREIGN KEY ("card_id") REFERENCES "wedding_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "content" = "content" || '{"guestInvite": {"enabled": false, "guestList": ""}}'::jsonb
      WHERE NOT ("content" ? 'guestInvite')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "wedding_cards" SET "content" = "content" - 'guestInvite'`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_guests" DROP CONSTRAINT "FK_card_guests_card"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_card_guests_card"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_card_guests_card_token"`);
    await queryRunner.query(`DROP TABLE "card_guests"`);
  }
}
