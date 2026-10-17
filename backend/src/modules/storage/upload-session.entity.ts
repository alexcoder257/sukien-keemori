import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

/**
 * Một phiên soạn thiệp trong editor, **có trước cả tài khoản**: khách chưa đăng
 * nhập vẫn mở được phiên để ảnh lên vùng tạm ngay lúc chọn, thay vì dồn cả
 * album lại chờ tới lúc đăng nhập xong.
 *
 * Quyền trên phiên là **token mang theo** (`<id>.<secret>`), không phải tài
 * khoản — người chưa đăng nhập không có tài khoản nào để kiểm. Chỉ lưu băm
 * SHA-256 của phần bí mật: lộ bảng này không lộ token. Token 32 byte ngẫu nhiên
 * nên không cần băm chậm kiểu bcrypt.
 *
 * `userId` không có khoá ngoại: nó chỉ để xếp ưu tiên trong hàng đợi nén, và
 * phiên chết sau một ngày — xoá tài khoản không cần phải kéo theo nó.
 */
@Entity('upload_sessions')
export class UploadSession extends BaseEntity {
  @Column({ name: 'secret_hash', type: 'varchar', length: 64, select: false })
  secretHash: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Index('IDX_upload_sessions_expires_at')
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;
}
