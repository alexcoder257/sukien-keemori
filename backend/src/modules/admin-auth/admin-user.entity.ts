import { BaseEntity } from '@configuration/base-entity/base.entity';
import { ADMIN_ROLES } from '@common/enums/admin-role.enum';
import type { AdminRole } from '@common/enums/admin-role.enum';
import { Column, Entity, Index } from 'typeorm';

/**
 * Người vận hành CMS. Tách hẳn khỏi `users` (khách): token của bảng này ký bằng
 * secret riêng, nên một tài khoản khách không bao giờ mở được route
 * `/admin/*` và ngược lại.
 *
 * Không có route tự đăng ký: tài khoản được tạo bằng migration/seed.
 */
@Entity('admin_users')
export class AdminUserEntity extends BaseEntity {
  // Luôn lưu chữ thường; đăng nhập so bằng `LOWER(email)`.
  @Index('IDX_admin_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ type: 'enum', enum: ADMIN_ROLES, default: 'editor' })
  role: AdminRole;

  // Bcrypt của SHA-256 client gửi lên, cùng quy ước với `users.password_hash`.
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash: string;

  // SHA-256 của refresh token đang sống — một phiên mỗi tài khoản; `NULL` là đã
  // đăng xuất hoặc vừa đổi mật khẩu.
  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  refreshTokenHash: string | null;

  /** Tắt thì mọi token đang sống bị từ chối ngay ở request kế tiếp. */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;
}
