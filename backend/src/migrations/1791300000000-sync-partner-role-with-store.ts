import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đưa dữ liệu đang có về khớp luật "tài khoản là `partner` ⇔ hồ sơ cửa hàng
 * `approved` và `active`".
 *
 * Luật này từng bị phá bằng màn đổi quyền ở trang Người dùng: nó chỉ sửa
 * `users.role`, nên hạ một đối tác về `customer` để lại một hồ sơ "đã duyệt"
 * vẫn nằm trên danh bạ công khai và vẫn dùng được mã độc quyền; nâng một tài
 * khoản lên `partner` ở đó thì ra đối tác không có cửa hàng. Đường đó đã bị
 * chặn (`UserService.changeRole`); migration này dọn phần đã lệch.
 *
 * Hướng sửa theo **quyền tài khoản**, vì đó là thứ người vận hành đã chủ động
 * đổi lần cuối: hồ sơ của tài khoản không còn là `partner` bị khoá (coi như đã
 * thu hồi, khôi phục bằng nút Duyệt), còn tài khoản `partner` không có hồ sơ
 * đang hoạt động thì về `customer`. Không đụng `admin`/`super_admin`.
 *
 * `down` không làm gì: không biết được hàng nào đã lệch từ trước.
 */
export class SyncPartnerRoleWithStore1791300000000 implements MigrationInterface {
  name = 'SyncPartnerRoleWithStore1791300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "partner_stores" AS s
      SET "active" = false
      FROM "users" AS u
      WHERE u."id" = s."user_id"
        AND s."status" = 'approved'
        AND s."active" = true
        AND u."role" <> 'partner'
    `);
    await queryRunner.query(`
      UPDATE "users" AS u
      SET "role" = 'customer'
      WHERE u."role" = 'partner'
        AND NOT EXISTS (
          SELECT 1 FROM "partner_stores" AS s
          WHERE s."user_id" = u."id"
            AND s."status" = 'approved'
            AND s."active" = true
        )
    `);
  }

  public async down(): Promise<void> {
    // Cố ý không hoàn tác — xem docblock.
  }
}
