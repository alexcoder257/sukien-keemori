import { BaseEntity } from '@configuration/base-entity/base.entity';
import { TIERS } from '@common/enums/tier.enum';
import type { Tier } from '@common/enums/tier.enum';
import { WeddingCard } from '@modules/cards/wedding-card.entity';
import { User } from '@modules/user/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export const ORDER_STATUSES = ['pending', 'paid', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Entity('orders')
export class Order extends BaseEntity {
  /**
   * Người mua, `null` khi tài khoản đã bị xoá.
   *
   * **`SET NULL`, không phải `CASCADE`** — đơn hàng là chứng từ kế toán và phải
   * sống lâu hơn tài khoản đã mua nó. Trước đây cột này `CASCADE` nên người
   * dùng tự xoá tài khoản là xoá sạch doanh thu họ từng đóng góp, trái với
   * Chính sách bảo mật mục 12 đang đăng công khai.
   *
   * Đơn mất chủ vẫn tự đọc được: `tier`, `amount`, `listAmount`,
   * `discountAmount`, `voucherCode`, `paymentCode` và `paidAt` đều đã chốt giá
   * trị ngay trên hàng này. Cố ý **không** giữ ảnh chụp email — giữ đơn là để
   * đối soát tiền, không phải để lưu lại danh tính người đã yêu cầu xoá.
   */
  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  /**
   * Thiệp được mua gói cho, `null` khi thiệp đã bị xoá.
   *
   * Cũng phải là `SET NULL` vì đúng lý do trên, và đây là chỗ dễ bỏ sót: để
   * `CASCADE` ở cột này thì xoá tài khoản vẫn cuốn mất đơn hàng theo đường
   * vòng — user xoá thiệp, thiệp xoá đơn — dù `user_id` đã được gỡ cascade.
   */
  @Index()
  @Column({ name: 'card_id', type: 'uuid', nullable: true })
  cardId: string | null;

  @ManyToOne(() => WeddingCard, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'card_id' })
  card: WeddingCard | null;

  /**
   * Gói được mua. Đây là **`planTier`**, không phải tier của mẫu: khách dùng
   * mẫu Free trên gói Diamond phải bị tính giá Diamond, nếu tính theo
   * `template.tier` thì thu thiếu (`docs/business-model.md` mục 5).
   */
  @Column({ type: 'enum', enum: TIERS })
  tier: Tier;

  /**
   * Đơn mua **Diamond Song Hỷ** — thiệp riêng nhà trai / nhà gái. Song Hỷ không
   * phải một giá trị của `tier`: nó có đúng quyền ảnh và album của Diamond, nên
   * `tier` vẫn là `diamond` và cờ này nói phần mua thêm. Là cờ chứ không phải
   * một bậc gói vì `TIERS` còn là cấp thiết kế của mẫu, mà không mẫu nào thuộc
   * về "Song Hỷ".
   *
   * Thiệp đã trả Diamond thì đơn Song Hỷ chỉ là **phần mua thêm**
   * (`tier_prices.family_split_upgrade_price`).
   */
  @Column({ name: 'family_split', type: 'boolean', default: false })
  familySplit: boolean;

  @Column({ type: 'enum', enum: ORDER_STATUSES, default: 'pending' })
  status: OrderStatus;

  /**
   * Số tiền (VND) phải trả, **chốt tại thời điểm tạo đơn**. Admin đổi bảng giá
   * thì đơn đang chờ vẫn giữ giá đã báo cho khách.
   */
  @Column({ type: 'int' })
  amount: number;

  /**
   * Giá niêm yết trước khi trừ khuyến mãi gói và mã giảm giá, chốt cùng lúc với
   * `amount`. Không suy ngược lại từ bảng giá được: admin đổi giá hay dừng
   * chiến dịch thì phép trừ ngược ra một con số chưa từng hiện cho khách, mà
   * đây đúng là số phải in trên biên nhận.
   */
  @Column({ name: 'list_amount', type: 'int', default: 0 })
  listAmount: number;

  /** Số tiền mã giảm giá đã trừ; `0` cho đơn không dùng mã. */
  @Column({ name: 'discount_amount', type: 'int', default: 0 })
  discountAmount: number;

  /** Mã đã dùng, `null` khi không có. Giữ id để báo cáo chiến dịch nối lại. */
  @Index()
  @Column({ name: 'voucher_id', type: 'uuid', nullable: true })
  voucherId: string | null;

  /**
   * Chữ của mã tại lúc đặt. Trùng lặp với `voucher_id` một cách có chủ đích:
   * admin xoá một mã đã hết chiến dịch thì `voucher_id` thành `null`, mà biên
   * nhận cũ vẫn phải đọc được là đơn đó đã dùng mã nào.
   */
  @Column({ name: 'voucher_code', type: 'varchar', length: 32, nullable: true })
  voucherCode: string | null;

  /**
   * Đơn này có được hưởng giá mua lại không. Giảm giá mua lại tính riêng cho
   * từng user và **độc lập theo từng gói** (`CLAUDE.md` mục 6), nên cờ này là
   * kết quả của phép đếm "đã từng trả tiền cho đúng gói này chưa".
   */
  @Column({ name: 'is_repeat_purchase', type: 'boolean', default: false })
  isRepeatPurchase: boolean;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  /**
   * Mã tham chiếu từ cổng thanh toán — `referenceCode` của ngân hàng, do
   * webhook SePay điền vào khi gọi `markPaid`. Đây là thứ để đối chiếu khi phải
   * gọi lên tổng đài ngân hàng hỏi về một giao dịch cụ thể.
   */
  @Column({
    name: 'gateway_reference',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  gatewayReference: string | null;

  /**
   * Mã đơn xuất hiện trong **nội dung chuyển khoản** — cách duy nhất để nhận ra
   * tiền vừa về là của đơn nào, vì mọi đơn đều chuyển vào cùng một tài khoản.
   *
   * Unique để hai đơn không bao giờ tranh nhau một khoản tiền.
   *
   * Ngày chuyển sang **tài khoản định danh (VA)**, vai trò này thuộc về số tài
   * khoản nhận và cột này thành dữ liệu lịch sử — đó là lý do nó nullable ngay
   * từ đầu chứ không phải `NOT NULL`.
   */
  @Index({ unique: true, where: 'payment_code IS NOT NULL' })
  @Column({ name: 'payment_code', type: 'varchar', length: 20, nullable: true })
  paymentCode: string | null;
}
