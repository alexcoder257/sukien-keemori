import { BaseEntity } from '@configuration/base-entity/base.entity';
import type {
  AuditAction,
  AuditTargetType,
} from '@common/enums/audit-action.enum';
import { Column, Entity, Index } from 'typeorm';

/**
 * Một dòng nhật ký thao tác.
 *
 * **Không có quan hệ TypeORM nào, và đó là điều quan trọng nhất của bảng này.**
 * Mọi khoá ngoại trỏ về `users` trong repo đều là `ON DELETE CASCADE` (9 chỗ).
 * Nếu bảng này cũng làm vậy thì xoá một tài khoản sẽ **cuốn theo chính dòng ghi
 * lại việc xoá đó** — nhật ký biến mất đúng lúc cần nhất. `actorId`/`targetId`
 * vì vậy là uuid trần: không khoá ngoại, không join, không cascade.
 *
 * Hệ quả phải chấp nhận: id trỏ tới một hàng có thể không còn tồn tại. Đó là lý
 * do mỗi dòng mang theo **ảnh chụp** (`actorEmail`, `targetLabel`) — dòng nhật
 * ký phải tự đọc được mà không cần tra bảng khác, vì bảng khác chính là thứ vừa
 * bị xoá.
 */
@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 64 })
  action: AuditAction;

  /**
   * Ai làm. `null` khi hệ thống tự làm (cron) — hiện chưa có, nhưng cột để
   * nullable từ đầu thì thêm loại sau không phải migration đổi kiểu.
   */
  @Index()
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  /** Ảnh chụp lúc thao tác. Actor tự xoá tài khoản thì đây là thứ còn lại. */
  @Column({ name: 'actor_email', type: 'varchar', length: 255, nullable: true })
  actorEmail: string | null;

  /** Quyền **tại thời điểm đó**, không phải quyền hiện tại của tài khoản. */
  @Column({ name: 'actor_role', type: 'varchar', length: 128, nullable: true })
  actorRole: string | null;

  @Index()
  @Column({ name: 'target_type', type: 'varchar', length: 32 })
  targetType: AuditTargetType;

  @Index()
  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId: string | null;

  /** Ảnh chụp để nhận ra đối tượng: email, tên cửa hàng, mã đơn. */
  @Column({
    name: 'target_label',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  targetLabel: string | null;

  /**
   * Chi tiết riêng của từng loại: vai trò cũ/mới, số thiệp và số thư mục ảnh đã
   * dọn, lý do từ chối. Cố ý là `jsonb` tự do — ràng buộc hình dạng ở đây sẽ
   * biến mỗi loại sự kiện mới thành một migration.
   *
   * **Không đặt dữ liệu cá nhân không cần thiết vào đây.** Người dùng tự xoá
   * tài khoản là để lấy lại dữ liệu của mình; nhật ký giữ đủ để đối trace, chứ
   * không phải là bản sao lưu của hồ sơ vừa xoá.
   */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  /**
   * IP của người thao tác. Có thể `null`: sau reverse proxy mà chưa cấu hình
   * `trust proxy` thì giá trị đọc được là IP của chính proxy, và một IP sai còn
   * tệ hơn không có IP.
   */
  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;
}
