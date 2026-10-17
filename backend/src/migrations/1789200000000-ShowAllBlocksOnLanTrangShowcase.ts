import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bật đủ 14 block cho thiệp trưng bày của mẫu Lan Trắng
 * (`wedding_cards.slug = 'tuan-anh-nhu-binh'`, cũng là `DEMO_INVITATION_SLUG`
 * của CTA "Xem thiệp mẫu" ở hero).
 *
 * Thiệp này được seed với `ceremonies` và `giftBox` tắt, kèm ghi chú rằng Lan
 * Trắng dựng nghi lễ vào chính khối tiệc và không có chương hộp mừng cưới. Ghi
 * chú đó đã cũ: `lan-trang-invitation.tsx` giờ vẽ cả hai chương và CSS Module
 * có art direction riêng cho chúng (`.ceremonies`, `.giftChapter`), nên hai
 * công tắc tắt chỉ còn giấu đi phần thiệp đã dựng xong.
 *
 * Vì sao là migration chứ không phải sửa seed: seed không có khái niệm "đã chạy
 * rồi" và ở chế độ mặc định `ONLY_NEW` nó **bỏ qua** thiệp đã tồn tại — nên
 * sửa file seed không đổi được gì trên một database đang chạy. Xem
 * `1789100000000-SyncTemplateCatalog.ts` cho lý do đầy đủ.
 *
 * Ghi bằng `||` (merge jsonb) chứ không phải `jsonb_set` từng khoá: nó vừa ghi
 * đủ 14 block trong một phép, vừa tự tạo `visibility` nếu hàng cũ thiếu khoá
 * đó. Danh sách block viết thẳng ở đây, không `import` từ
 * `constants/invitation.ts` — migration là một lát cắt đông cứng của thời gian,
 * thêm block thứ 15 sau này không được đổi ý nghĩa của file này.
 */
export class ShowAllBlocksOnLanTrangShowcase1789200000000 implements MigrationInterface {
  name = 'ShowAllBlocksOnLanTrangShowcase1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "content" = jsonb_set(
        "content",
        '{visibility}',
        COALESCE("content" -> 'visibility', '{}'::jsonb) || '{
          "envelope": true,
          "couple": true,
          "families": true,
          "ceremonies": true,
          "reception": true,
          "dressCode": true,
          "timeline": true,
          "countdown": true,
          "story": true,
          "album": true,
          "giftBox": true,
          "wishes": true,
          "music": true,
          "thankYou": true
        }'::jsonb,
        true
      )
      WHERE "slug" = 'tuan-anh-nhu-binh'
    `);
  }

  /**
   * Trả lại đúng trạng thái seed của riêng thiệp này: hai block từng bị ẩn.
   * Mười hai block còn lại vốn đã bật nên `up` không đổi gì ở chúng, và `down`
   * cũng không được tự ý tắt.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "wedding_cards"
      SET "content" = jsonb_set(
        "content",
        '{visibility}',
        COALESCE("content" -> 'visibility', '{}'::jsonb)
          || '{"ceremonies": false, "giftBox": false}'::jsonb,
        true
      )
      WHERE "slug" = 'tuan-anh-nhu-binh'
    `);
  }
}
