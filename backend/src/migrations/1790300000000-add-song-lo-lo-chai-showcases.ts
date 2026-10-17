import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đưa bản demo của Sóng và Lô Lô Chải lên dải "Cặp đôi đã tạo thiệp".
 *
 * Hai ô là `kind = 'template'` nên link tới `/mau-thiep/<slug>/demo`, không cần
 * một thiệp dựng sẵn trong `wedding_cards`. Tên và ngày khớp cặp đôi mẫu của
 * từng mẫu (`frontend/lib/data/sample-couples.ts`), để chữ trên ô và chữ trong
 * bản demo là một.
 *
 * Bảng này CMS làm chủ (`/cap-doi-trang-chu`): `DO NOTHING` khi slug đã có, để
 * không ghi đè ảnh, thứ tự hay trạng thái admin đã chỉnh. Ô mới xếp nối đuôi.
 */
export class AddSongLoLoChaiShowcases1790300000000 implements MigrationInterface {
  name = 'AddSongLoLoChaiShowcases1790300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "couple_showcases" (
        "slug", "kind", "names", "wedding_date", "image_src",
        "image_position", "sort_order"
      )
      SELECT v."slug", 'template', v."names", '28/10/2026', v."image_src",
        '50% 0%',
        COALESCE((SELECT MAX("sort_order") FROM "couple_showcases"), -1)
          + ROW_NUMBER() OVER (ORDER BY v."position")
      FROM (VALUES
        (1, 'song', 'Hoàng Long & Phương Nhi',
          '/images/templates/song/thumbnail.avif'),
        (2, 'lo-lo-chai', 'Hoàng Kiên & Phương Khanh',
          '/images/templates/lo-lo-chai/thumbnail.avif')
      ) AS v("position", "slug", "names", "image_src")
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "couple_showcases"
       WHERE "kind" = 'template' AND "slug" IN ('song', 'lo-lo-chai')`,
    );
  }
}
