import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from '@common/enums/notification.enum';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { User } from '@modules/user/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Nội dung của một thông báo "có lời chúc chờ duyệt". Giữ sẵn `cardSlug` và
 * `cardTitle` thay vì join lại lúc đọc: thông báo là **ảnh chụp tại thời điểm
 * xảy ra**, đổi tên thiệp sau đó không được viết lại quá khứ, và danh sách
 * chuông phải đọc được bằng đúng một câu query.
 */
export interface WishPendingPayload {
  cardId: string;
  cardSlug: string;
  cardTitle: string;
  /** Số lời chúc đã dồn vào thông báo này (xem `groupKey`). */
  count: number;
  /** Tên người gửi gần nhất — đủ để câu thông báo có một cái tên cụ thể. */
  latestName: string;
}

/**
 * Tiền của một đơn vừa về và thiệp đã được xuất bản. Không mang số tiền:
 * chuông là lời nhắc chứ không phải hóa đơn (biên nhận nằm trong email).
 */
export interface PaymentSuccessPayload {
  orderId: string;
  cardId: string;
  cardSlug: string;
  cardTitle: string;
}

/**
 * Hai loại thông báo hoạt động: `wish_pending` và `payment_success`. Hàng cũ
 * của hai loại đã gỡ (`link_expiring`, `link_expired`) có thể còn trong bảng
 * với payload khác hình dạng — `NotificationRepository.findRecent` không bao
 * giờ trả chúng ra.
 */
export type NotificationPayload = WishPendingPayload | PaymentSuccessPayload;

/**
 * Một thông báo trong chuông của người dùng.
 *
 * Bảng riêng chứ không suy ra từ dữ liệu nguồn (đếm `wishes.approved = false`)
 * vì trạng thái **đã đọc** không có chỗ nào để sống trong dữ liệu nguồn, và vì
 * chuông có thể phải mang các sự kiện khác vốn không cùng một phép đếm.
 */
@Entity('notifications')
// Hai truy vấn duy nhất đều lọc theo người nhận: danh sách mới nhất và đếm
// chưa đọc.
@Index(['userId', 'lastEventAt'])
@Index(['userId', 'readAt'])
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NOTIFICATION_TYPES })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  payload: NotificationPayload;

  /**
   * Khoá gom nhóm, dạng `<type>:<id nguồn>`. Ngày cưới có thể vào vài chục lời
   * chúc trong ít phút; mỗi lời chúc một dòng thì chuông thành sổ log. Sự kiện
   * mới trùng `groupKey` với một thông báo **chưa đọc** sẽ cộng dồn vào dòng đó
   * thay vì tạo dòng mới. Đã đọc rồi thì lần sau mở dòng mới — người dùng cần
   * biết là có cái mới.
   */
  @Column({ name: 'group_key', type: 'varchar', length: 120 })
  groupKey: string;

  /**
   * Thời điểm sự kiện gần nhất rơi vào nhóm này — cột tự quản thay vì mượn
   * `updatedAt`, vì `updatedAt` còn bị "đánh dấu đã đọc" chạm vào và sẽ đẩy
   * thông báo cũ lên đầu danh sách.
   */
  @Column({ name: 'last_event_at', type: 'timestamptz' })
  lastEventAt: Date;

  /** `null` là chưa đọc. Lưu mốc thời gian chứ không phải cờ boolean. */
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;
}
