import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

/** Trừ phần trăm hay trừ thẳng một số tiền. Không có loại thứ ba. */
export const VOUCHER_DISCOUNT_TYPES = ['percent', 'amount'] as const;
export type VoucherDiscountType = (typeof VOUCHER_DISCOUNT_TYPES)[number];

/** Phạm vi thương mại của voucher; Song Hỷ không phải tier thiết kế. */
export const VOUCHER_PLANS = ['gold', 'diamond', 'family-split'] as const;
export type VoucherPlan = (typeof VOUCHER_PLANS)[number];

/**
 * Mã giảm giá khách nhập ở hộp thanh toán.
 *
 * Voucher tính **sau** khuyến mãi của gói (`tier_prices.discount_percent`):
 * khuyến mãi gói là giá niêm yết đang chạy, còn voucher là ưu đãi riêng của một
 * người. Cộng dồn theo thứ tự ngược lại thì cùng một mã lại ra hai số tiền tuỳ
 * lúc admin có đang chạy khuyến mãi hay không.
 */
@Entity('vouchers')
export class Voucher extends BaseEntity {
  /**
   * Mã khách gõ vào. Luôn lưu **chữ hoa, không khoảng trắng** (`normalizeCode`)
   * để `WEDDING10` và ` wedding10 ` là một mã — người dùng gõ tay trên điện
   * thoại, và bàn phím tự viết hoa chữ đầu.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  code: string;

  /** Ghi chú nội bộ: mã này phát cho ai, chiến dịch nào. Khách không thấy. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: VOUCHER_DISCOUNT_TYPES,
  })
  discountType: VoucherDiscountType;

  /** Phần trăm (0–100) hoặc số tiền VND, tuỳ `discountType`. */
  @Column({ name: 'discount_value', type: 'int' })
  discountValue: number;

  /**
   * Trần số tiền được giảm, chỉ có nghĩa với mã phần trăm. Đây là thứ chặn một
   * mã "giảm 50%" phát cho chiến dịch gói Gold trở thành nửa giá gói Diamond.
   */
  @Column({ name: 'max_discount', type: 'int', nullable: true })
  maxDiscount: number | null;

  /**
   * Gói được áp mã. **Mảng rỗng nghĩa là mọi gói** — đó là mặc định, và cũng là
   * lý do không dùng `null`: một cột mảng có hai cách biểu diễn "tất cả" thì
   * chỗ nào cũng phải kiểm hai lần.
   */
  @Column({ type: 'simple-array', default: '' })
  tiers: VoucherPlan[];

  /** Giá tối thiểu của đơn (sau khuyến mãi gói) mới dùng được mã. */
  @Column({ name: 'min_amount', type: 'int', default: 0 })
  minAmount: number;

  /** Chưa tới ngày này thì mã chưa chạy. `null` = có hiệu lực ngay. */
  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  /** `null` = không hết hạn. */
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  /** Tổng số lượt dùng được của cả mã. `null` = không giới hạn. */
  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number | null;

  /**
   * Số lượt **đã trả tiền xong**, không phải số đơn đã tạo. Đếm ở `markPaid`
   * chứ không ở lúc tạo đơn: khách mở hộp thanh toán rồi bỏ ngang là chuyện
   * thường, mà đếm sớm thì mỗi lần bỏ ngang lại đốt một suất của chiến dịch.
   */
  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount: number;

  /** Số lượt mỗi tài khoản được dùng. `null` = không giới hạn. */
  @Column({ name: 'per_user_limit', type: 'int', nullable: true, default: 1 })
  perUserLimit: number | null;

  /**
   * Công tắc tắt nhanh. Tách khỏi `expiresAt` vì hai việc khác nhau: hết hạn là
   * lịch đã định trước, còn tắt là phản ứng khi mã bị rò ra ngoài — và ngày hết
   * hạn cũ vẫn phải giữ nguyên để đối chiếu về sau.
   */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /** Cho phép chọn mã trong hộp thanh toán; không đổi quyền sử dụng mã. */
  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  /**
   * Không phải cột: chương trình đối tác đã gỡ, nhưng CMS vẫn đọc trường này
   * trong hình dạng voucher cũ nên luôn trả `null`.
   */
  readonly partnerStoreId: null = null;
}
