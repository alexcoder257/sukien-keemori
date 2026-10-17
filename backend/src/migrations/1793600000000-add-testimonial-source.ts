import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lời chứng thực mang theo **nơi khách nói** (`platform`) và **người nói là cô
 * dâu hay chú rể** (`author_role`), rồi thay ba lời dựng sẵn bằng hai bình luận
 * thật của khách trên Facebook.
 *
 * Ba lời cũ (Ngọc Lan, Quang Huy, Thu Thảo) là dữ liệu seed, không phải lời của
 * khách nào cả — để chúng nằm dưới dòng "Đánh giá thật từ khách hàng" là nói
 * sai. Chúng chỉ bị **ẩn**, không xoá, và chỉ khi còn đúng nguyên văn seed: dòng
 * nào admin đã sửa trong CMS thì là quyết định biên tập, migration không đụng.
 *
 * Hai lời mới chép nguyên văn bình luận, kể cả chữ viết tắt — chỉnh cho "đẹp"
 * thì không còn là lời của khách. Không lưu email hay tài khoản của người nói:
 * thẻ trên trang chủ chỉ cần tên hiển thị.
 */
export class AddTestimonialSource1793600000000 implements MigrationInterface {
  name = 'AddTestimonialSource1793600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "testimonials" ADD "platform" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "testimonials" ADD "author_role" character varying(10)`,
    );

    await queryRunner.query(`
      UPDATE "testimonials" SET "is_published" = false
      WHERE ("author", "quote") IN (
        ('Ngọc Lan', 'Mình làm xong thiệp trong 10 phút, gửi link cho họ hàng ai cũng khen đẹp.'),
        ('Quang Huy', 'Phần bản đồ và đếm ngược rất tiện, khách không còn gọi hỏi đường nữa.'),
        ('Thu Thảo', 'Album ảnh cưới hiển thị đẹp trên điện thoại, đúng cái mình cần.')
      )
    `);

    // Hai lời thật đứng đầu: dời mọi dòng đang có xuống hai bậc (giữ nguyên
    // thứ tự tương đối) thay vì dùng số âm — CMS chặn `sort_order` < 0, nên
    // dòng mang số âm sẽ không lưu lại được khi admin mở ra sửa.
    await queryRunner.query(
      `UPDATE "testimonials" SET "sort_order" = "sort_order" + 2`,
    );
    await queryRunner.query(`
      INSERT INTO "testimonials"
        ("author", "rating", "quote", "platform", "author_role", "sort_order", "is_published")
      SELECT v."author", 5, v."quote", 'facebook', 'bride', v."sort_order", true
      FROM (VALUES
        ('Thùy Nhung Nguyễn',
         'Oki bạn, mình thấy thiệp bên bạn đẹp lắm, có guu ấy, concept xuyên suốt thiệp luôn, không bị đại trà. Với thông tin ngắn gọn đầy đủ k bị dài dòng nhiều hiệu ứng bay bay lướt sẽ rối mắt. Mà người dùng cũng dễ sử dụng thay đổi thông tin như mong muốn',
         0),
        ('Nhữ Bu',
         'ê mà thiệp keemori đẹp thiệt hehe, lựa mấy web r may quá va đc vào đây',
         1)
      ) AS v("author", "quote", "sort_order")
      WHERE NOT EXISTS (
        SELECT 1 FROM "testimonials" t
        WHERE t."author" = v."author" AND t."quote" = v."quote"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "testimonials" DROP COLUMN "author_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "testimonials" DROP COLUMN "platform"`,
    );
  }
}
