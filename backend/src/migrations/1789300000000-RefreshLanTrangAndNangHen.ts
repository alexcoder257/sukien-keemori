import { MigrationInterface, QueryRunner } from 'typeorm';

/** Release snapshot: update code-owned metadata and the known Lan Trắng demo only. */
export class RefreshLanTrangAndNangHen1789300000000 implements MigrationInterface {
  name = 'RefreshLanTrangAndNangHen1789300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "templates" AS t
      SET "name" = v.name,
          "photo_slots" = v.photo_slots::character varying(20)[],
          "image_position" = '50% 0%',
          "image_src" = '/images/templates/' || t.slug || '/thumbnail.avif',
          "updated_at" = NOW()
      FROM (VALUES
        ('lan-trang', 'Lan Trắng', '{cover,couple,groom,bride,story,closing}'),
        ('nang-hen', 'Nắng Hẹn', '{cover,couple,story,closing}')
      ) AS v(slug, name, photo_slots)
      WHERE t.slug = v.slug
    `);

    // Only replace the old demo names; never rewrite real bank details or other cards.
    for (const [side, previous, current] of [
      ['groom', 'NGUYEN HOANG MINH', 'TUAN ANH'],
      ['bride', 'TRAN NGOC LAN', 'NHU BINH'],
    ]) {
      await queryRunner.query(
        `UPDATE "wedding_cards"
         SET "content" = jsonb_set("content", ARRAY['giftBox', $1, 'accountName'], to_jsonb($2::text)),
             "updated_at" = NOW()
         WHERE "slug" = 'tuan-anh-nhu-binh' AND "template_slug" = 'lan-trang'
           AND "content" #>> ARRAY['giftBox', $1, 'accountName'] = $3`,
        [side, current, previous],
      );
    }

    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "content" = jsonb_set("content", '{timeline,items}', '[
        {"startTime":"17:30","endTime":"","activity":"Đón khách"},
        {"startTime":"18:00","endTime":"","activity":"Lễ thành hôn"},
        {"startTime":"18:30","endTime":"","activity":"Khai tiệc"},
        {"startTime":"19:30","endTime":"","activity":"Chụp ảnh cùng gia đình"}
      ]'::jsonb), "updated_at" = NOW()
      WHERE "slug" = 'tuan-anh-nhu-binh' AND "template_slug" = 'lan-trang'
        AND "content" #> '{timeline,items}' = '[
          {"startTime":"17:30","endTime":"","activity":"Đón khách"},
          {"startTime":"18:30","endTime":"","activity":"Khai tiệc"}
        ]'::jsonb
    `);
  }

  public async down(): Promise<void> {
    // Forward-only data correction: reverting must not restore incorrect names
    // or overwrite edits made to the demo after deployment.
  }
}
