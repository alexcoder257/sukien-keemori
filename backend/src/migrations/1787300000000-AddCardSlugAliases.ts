import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Giữ lại đường dẫn cũ của thiệp sau khi đổi link.
 *
 * Bảng mới hoàn toàn nên `down` xoá sạch được — nhưng chạy `down` trên môi
 * trường thật nghĩa là mọi link cũ đã phát cho khách mời sẽ chết ngay lập tức.
 *
 * `ON DELETE CASCADE`: xoá thiệp thì đường dẫn cũ của nó cũng hết ý nghĩa, và
 * lúc đó slug được giải phóng cho người khác — đúng như khi xoá thiệp thì slug
 * chính cũng được giải phóng.
 */
export class AddCardSlugAliases1787300000000 implements MigrationInterface {
  name = 'AddCardSlugAliases1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "card_slug_aliases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "slug" character varying(60) NOT NULL,
        "card_id" uuid NOT NULL,
        CONSTRAINT "PK_card_slug_aliases" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_card_slug_aliases_slug" ON "card_slug_aliases" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_card_slug_aliases_card" ON "card_slug_aliases" ("card_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_slug_aliases" ADD CONSTRAINT "FK_card_slug_aliases_card" FOREIGN KEY ("card_id") REFERENCES "wedding_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "card_slug_aliases" DROP CONSTRAINT "FK_card_slug_aliases_card"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_card_slug_aliases_card"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_card_slug_aliases_slug"`);
    await queryRunner.query(`DROP TABLE "card_slug_aliases"`);
  }
}
