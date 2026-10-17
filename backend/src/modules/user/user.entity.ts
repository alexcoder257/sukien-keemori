import { BaseEntity } from '@configuration/base-entity/base.entity';
import { USER_ROLES } from '@common/enums/user-role.enum';
import type { UserRole } from '@common/enums/user-role.enum';
import { Column, DeleteDateColumn, Entity, Index } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  /**
   * Quyền của tài khoản. hiện chỉ còn `customer`. Không bao giờ nhận từ
   * body đăng ký.
   */
  @Column({ type: 'enum', enum: USER_ROLES, default: 'customer' })
  role: UserRole;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  // Số liên lạc hiển thị trong hồ sơ; không dùng để đăng nhập.
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  /** Nhận email về thanh toán, đánh giá và tin tức. */
  @Column({ name: 'email_notifications', type: 'boolean', default: true })
  emailNotifications: boolean;

  /**
   * Cho phép admin chọn thiệp của tài khoản này trưng bày trên trang chủ
   * (`WeddingCard.showcasedOnHome`). Đây là sự đồng ý của chủ thiệp; việc
   * chọn vẫn là của admin.
   */
  @Column({ name: 'allow_showcase', type: 'boolean', default: true })
  allowShowcase: boolean;

  // Bcrypt hash của mật khẩu (mật khẩu client đã SHA-256 trước khi gửi lên).
  // `select: false` → mặc định KHÔNG trả cột này khi query, tránh lộ hash.
  // Nullable vì tài khoản tạo qua Google chưa từng đặt mật khẩu; những tài
  // khoản đó chỉ đăng nhập được bằng Google cho tới khi đặt mật khẩu qua
  // luồng "quên mật khẩu".
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordHash: string | null;

  /**
   * `sub` của Google — định danh không đổi kể cả khi người dùng đổi email bên
   * Google, nên đây mới là khoá nối tài khoản, không phải email.
   */
  @Index({ unique: true })
  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  googleId: string | null;

  /**
   * `id` của Facebook — cũng là định danh không đổi, nhưng chỉ không đổi
   * **trong phạm vi một app**: cùng một người đăng nhập vào app khác sẽ có id
   * khác. Vì vậy đổi `FACEBOOK_APP_ID` là mất đường nối của mọi tài khoản đã
   * nối, không phải một biến môi trường chỉnh tuỳ tiện được.
   */
  @Index({ unique: true })
  @Column({
    name: 'facebook_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  facebookId: string | null;

  // Ảnh đại diện lấy từ nhà cung cấp OAuth (nếu có).
  @Column({
    name: 'avatar_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  avatarUrl: string | null;

  // Bcrypt hash của refresh token hiện hành (để rotate & thu hồi khi logout).
  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  refreshTokenHash: string | null;

  /**
   * Mốc admin vô hiệu hoá tài khoản. `null` là tài khoản đang dùng bình thường.
   *
   * Xoá từ CMS là **soft delete**: hàng vẫn nằm nguyên nên thiệp, đơn hàng và
   * hồ sơ đối tác của tài khoản không biến mất theo `ON DELETE CASCADE`, và
   * `email` vẫn giữ chỗ ở unique index — địa chỉ đó không đăng ký lại được.
   * Mọi truy vấn qua repository tự loại hàng này (TypeORM thêm
   * `deleted_at IS NULL`), nên tài khoản mất luôn đường đăng nhập và refresh.
   *
   * Khác với người dùng **tự** xoá tài khoản ở `AuthService.deleteAccount` —
   * đó là xoá thật, vì người ta có quyền rời đi và lấy lại email của mình.
   */
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
