import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đối tác mẫu "Keemori studio" cho danh bạ `/doi-tac`.
 *
 * Hồ sơ cửa hàng bắt buộc gắn với một tài khoản (`partner_stores.user_id`),
 * nên migration tạo kèm tài khoản `studio@keemori.com`, quyền `partner`, **không
 * có mật khẩu**: không đăng nhập được bằng mật khẩu, nên không mở ra cửa sau
 * nào; chủ hộp thư nhận lại quyền đăng nhập qua "Quên mật khẩu" nếu cần.
 *
 * Giữ luật "tài khoản là `partner` ⇔ hồ sơ `approved` + `active`" (xem
 * `SyncPartnerRoleWithStore`): email đã thuộc một tài khoản quản trị thì bỏ qua
 * hẳn, còn tài khoản `customer` sẵn có thì được nâng lên `partner` cùng lúc với
 * hồ sơ. Chạy lại không tạo trùng.
 *
 * Số điện thoại để trống như đường admin nâng thẳng (`promote`): dữ liệu mẫu
 * không có, và danh bạ công khai không hiện số điện thoại.
 */
const EMAIL = 'studio@keemori.com';

export class AddSamplePartnerStore1791400000000 implements MigrationInterface {
  name = 'AddSamplePartnerStore1791400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "users" ("email", "role", "full_name")
       VALUES ($1, 'partner', 'Keemori studio')
       ON CONFLICT ("email") DO NOTHING`,
      [EMAIL],
    );

    await queryRunner.query(
      `INSERT INTO "partner_stores" (
         "name", "contact_name", "phone", "address", "social_url",
         "user_id", "active", "status", "reviewed_at"
       )
       SELECT
         'Keemori studio', 'Keemori studio', '',
         'Tòa A Hateco, Yên Sở, Hoàng Mai, Hà Nội',
         'https://www.facebook.com/profile.php?id=61591592918188',
         u."id", true, 'approved', now()
       FROM "users" AS u
       WHERE u."email" = $1
         AND u."role" IN ('customer', 'partner')
         AND u."deleted_at" IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM "partner_stores" AS s WHERE s."user_id" = u."id"
         )`,
      [EMAIL],
    );

    await queryRunner.query(
      `UPDATE "users" AS u
       SET "role" = 'partner'
       WHERE u."email" = $1
         AND u."role" = 'customer'
         AND EXISTS (
           SELECT 1 FROM "partner_stores" AS s
           WHERE s."user_id" = u."id"
             AND s."status" = 'approved'
             AND s."active" = true
         )`,
      [EMAIL],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Chỉ xoá khi tài khoản vẫn đúng là tài khoản mẫu không mật khẩu do
    // migration này tạo — một tài khoản đã có người nhận và đặt mật khẩu thì
    // không được xoá theo. Xoá user kéo theo hồ sơ (`ON DELETE CASCADE`).
    await queryRunner.query(
      `DELETE FROM "users"
       WHERE "email" = $1
         AND "password_hash" IS NULL
         AND "google_id" IS NULL
         AND "facebook_id" IS NULL`,
      [EMAIL],
    );
  }
}
