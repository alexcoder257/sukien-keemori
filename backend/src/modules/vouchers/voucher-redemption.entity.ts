import { BaseEntity } from '@configuration/base-entity/base.entity';
import { User } from '@modules/user/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Voucher } from './voucher.entity';

/**
 * Một lượt dùng mã **đã trả tiền xong**. Đây là nguồn duy nhất trả lời "người
 * này đã dùng mã bao nhiêu lần" (`perUserLimit`); `vouchers.used_count` chỉ là
 * bản đếm sẵn của bảng này để không phải `COUNT(*)` ở mỗi lần báo giá.
 *
 * Không tham chiếu `Order` bằng quan hệ TypeORM: `commerce` đã biết `vouchers`
 * (đơn có `voucher_id`), thêm chiều ngược lại là một vòng phụ thuộc giữa hai
 * module đổi lấy một `JOIN` mà chưa ai cần. `order_id` vẫn là khoá ngoại thật ở
 * tầng database, khai trong migration.
 */
@Entity('voucher_redemptions')
export class VoucherRedemption extends BaseEntity {
  @Index()
  @Column({ name: 'voucher_id', type: 'uuid' })
  voucherId: string;

  @ManyToOne(() => Voucher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Đơn đã dùng mã. Unique: `markPaid` từ chối một đơn đã `paid`, nhưng ràng
   * buộc ở database mới là thứ chặn được hai luồng chạy song song cùng ghi
   * nhận một đơn — webhook SePay thử lại tới 7 lần.
   */
  @Index({ unique: true })
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  /** Số tiền đã giảm, chốt tại lúc trả — báo cáo chiến dịch đọc cột này. */
  @Column({ name: 'discount_amount', type: 'int' })
  discountAmount: number;
}
