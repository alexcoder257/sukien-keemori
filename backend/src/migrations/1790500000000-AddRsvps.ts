import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Xác nhận tham dự: bảng `rsvps` và block `rsvp` trong `content.visibility`.
 *
 * `guest_id` trỏ về `card_guests` với `ON DELETE SET NULL`: sửa chính tả một tên
 * trong danh sách khách là xoá hàng khách cũ, và câu trả lời khách đã gửi không
 * được mất theo. Unique **từng phần** (`WHERE guest_id IS NOT NULL`) — mỗi link
 * riêng một phản hồi, còn phản hồi từ link chung thì không có gì để khoá.
 *
 * Backfill `visibility.rsvp = false` cho mọi thiệp đã có: `IsBlockVisibility`
 * đòi đủ khoá, nên thiệp cũ thiếu khoá này sẽ không lưu lại được từ editor. Giá
 * trị viết thẳng ở đây, không `import` từ `empty-content.ts`; chỉ ghi vào hàng
 * **chưa có** khoá để không tắt mất block ai đó vừa bật.
 */
export class AddRsvps1790500000000 implements MigrationInterface {
  name = 'AddRsvps1790500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rsvps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "card_id" uuid NOT NULL,
        "guest_id" uuid,
        "name" character varying(120) NOT NULL,
        "attending" boolean NOT NULL,
        "party_size" integer NOT NULL,
        CONSTRAINT "PK_rsvps" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rsvps_card" ON "rsvps" ("card_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_rsvps_guest" ON "rsvps" ("guest_id") WHERE "guest_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rsvps" ADD CONSTRAINT "FK_rsvps_card" FOREIGN KEY ("card_id") REFERENCES "wedding_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rsvps" ADD CONSTRAINT "FK_rsvps_guest" FOREIGN KEY ("guest_id") REFERENCES "card_guests"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "content" = jsonb_set("content", '{visibility,rsvp}', 'false'::jsonb)
      WHERE "content" ? 'visibility'
        AND NOT ("content"->'visibility' ? 'rsvp')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "content" = jsonb_set("content", '{visibility}', ("content"->'visibility') - 'rsvp')
      WHERE "content" ? 'visibility'
    `);
    await queryRunner.query(
      `ALTER TABLE "rsvps" DROP CONSTRAINT "FK_rsvps_guest"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rsvps" DROP CONSTRAINT "FK_rsvps_card"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_rsvps_guest"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_rsvps_card"`);
    await queryRunner.query(`DROP TABLE "rsvps"`);
  }
}
