import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Order } from '@modules/commerce/order.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export const MATCH_STATUSES = [
  /** Đã ghép được vào một đơn và đơn đó đã được đánh dấu đã trả. */
  'matched',
  /** Tiền đã về nhưng chưa biết của đơn nào — chờ người tra soát. */
  'unmatched',
  /** Đã ghép tay từ CMS. */
  'manual',
  /** Có ghép được đơn nhưng số tiền không đủ; **không** nâng gói. */
  'underpaid',
  /** Không phải tiền vào (chuyển đi), giữ lại để đối chiếu sổ sách. */
  'ignored',
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

/**
 * Một sự kiện biến động số dư do SePay bắn về.
 *
 * Bảng này là **sổ cái thô**, không phải trạng thái đơn hàng: mọi giao dịch về
 * đến webhook đều được ghi, kể cả giao dịch không ghép được đơn nào. Trạng thái
 * "đã trả tiền" vẫn thuộc về `orders` — ở đây chỉ ghi lại điều gì đã xảy ra ở
 * ngân hàng.
 *
 * Tách khỏi `orders` vì hai thứ này không tương ứng một-một: một đơn có thể
 * nhận nhiều lần chuyển (khách trả thiếu rồi bù), và một giao dịch có thể không
 * thuộc đơn nào (khách chuyển nhầm, hoặc tiền vào từ nguồn khác).
 */
@Entity('payment_transactions')
export class PaymentTransaction extends BaseEntity {
  /**
   * `id` của giao dịch bên SePay. **Khoá chống lặp**: SePay thử lại tối đa 7
   * lần trong 5 giờ nếu không nhận được `{"success": true}`, nên cùng một giao
   * dịch chắc chắn sẽ về nhiều lần. Unique index ở đây là hàng rào cuối cùng —
   * kể cả hai request chạy song song thì database vẫn chỉ cho một hàng.
   */
  @Index({ unique: true })
  @Column({ name: 'sepay_id', type: 'bigint' })
  sepayId: string;

  /**
   * Đơn đã ghép được. `null` nghĩa là tiền đã về mà chưa biết của ai — đây
   * chính là hàng đợi tra soát tay ở CMS.
   */
  @Index()
  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({ name: 'match_status', type: 'enum', enum: MATCH_STATUSES })
  matchStatus: MatchStatus;

  /** Ngân hàng nhận, theo cách SePay đặt tên (`Vietcombank`, `ACB`…). */
  @Column({ type: 'varchar', length: 60 })
  gateway: string;

  @Column({ name: 'account_number', type: 'varchar', length: 40 })
  accountNumber: string;

  /**
   * Tài khoản định danh (VA) nếu có. Hiện luôn `null` vì ta đang khớp bằng nội
   * dung; cột có sẵn từ đầu để ngày chuyển sang VA không phải backfill một bảng
   * đã có dữ liệu thật.
   */
  @Column({ name: 'sub_account', type: 'varchar', length: 40, nullable: true })
  subAccount: string | null;

  /** Số tiền thực nhận, VND. Có thể lệch với `order.amount` — xem `underpaid`. */
  @Column({ name: 'transfer_amount', type: 'bigint' })
  transferAmount: string;

  /** Nội dung chuyển khoản đã chuẩn hoá, nơi mã đơn nằm lẫn trong đó. */
  @Column({ type: 'text' })
  content: string;

  /** Mã đơn bóc được từ `content`; `null` khi khách xoá mất nội dung. */
  @Column({ name: 'payment_code', type: 'varchar', length: 20, nullable: true })
  paymentCode: string | null;

  /** Mã tham chiếu của ngân hàng — thứ để đối chiếu khi gọi lên tổng đài. */
  @Column({
    name: 'reference_code',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  referenceCode: string | null;

  @Column({ name: 'transaction_date', type: 'timestamptz' })
  transactionDate: Date;

  /**
   * Payload gốc của SePay, nguyên vẹn.
   *
   * Đây là dữ liệu cá nhân (tên và số tài khoản người gửi) nên **không được
   * trả ra API công khai** — chỉ CMS ở quyền admin mới đọc. Giữ nguyên bản vì
   * nhà cung cấp có thể thêm trường hoặc đổi định dạng, và lúc cần truy một
   * giao dịch hỏng thì không có cách nào dựng lại thứ đã không lưu.
   */
  @Column({ name: 'raw_payload', type: 'jsonb' })
  rawPayload: Record<string, unknown>;
}
