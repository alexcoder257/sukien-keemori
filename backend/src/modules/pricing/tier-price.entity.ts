import { BaseEntity } from '@configuration/base-entity/base.entity';
import { TIERS } from '@common/enums/tier.enum';
import type { Tier } from '@common/enums/tier.enum';
import { Column, Entity, Index } from 'typeorm';

/** Hàng duy nhất đang dùng của bảng giá. */
export const PRICED_TIER: Tier = 'diamond';

/**
 * Giá của gói thiệp. Site chỉ bán **một gói**, nên bảng này dùng đúng **một
 * hàng** — `tier = 'diamond'` (`PRICED_TIER`), tên cột `tier` là di sản từ lúc
 * còn Free/Gold/Diamond. Giá bán là `price`, khuyến mãi gói là
 * `discount_percent` (`null` = không cấu hình khuyến mãi).
 *
 * Các cột còn lại (`repeat_price`, `family_split_*`, `highlighted`, `surface`,
 * `album_*`) là di sản: giữ trong database vì bỏ cột cần migration phá dữ liệu
 * mà không có lợi gì, nhưng không code nào đọc chúng nữa.
 */
@Entity('tier_prices')
export class TierPrice extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'enum', enum: TIERS })
  tier: Tier;

  /** Giá lần mua đầu, đơn vị VND. Gói Free là 0 và miễn phí thật. */
  @Column({ type: 'int' })
  price: number;

  /**
   * Giá lần mua tiếp theo. Giảm giá mua lại tính **riêng theo từng gói**
   * (`CLAUDE.md` mục 6), nên nó là một cột của chính gói đó chứ không phải một
   * tỉ lệ chung.
   */
  @Column({ name: 'repeat_price', type: 'int' })
  repeatPrice: number;

  /**
   * Khuyến mãi của gói, tính bằng phần trăm trừ vào **giá tiền** (`price` và
   * `repeatPrice`). `null` là "không cấu hình khuyến mãi", và đó là lý do cột
   * này nullable chứ không `default 0`: bảng giá phân biệt "chưa cấu hình" với
   * "giảm 0%" bằng chính giá trị này — không có thì trang giá không vẽ nhãn
   * giảm và không gạch ngang giá gốc.
   */
  @Column({ name: 'discount_percent', type: 'int', nullable: true })
  discountPercent: number | null;

  /** Gói này có mở album ảnh không. Hiện chỉ Diamond. */
  @Column({ name: 'album_enabled', type: 'boolean', default: false })
  albumEnabled: boolean;

  /**
   * Trần cứng số ảnh album. Thiệp là link vĩnh viễn nên chi phí lưu trữ cũng
   * vĩnh viễn — không hứa "không giới hạn".
   */
  @Column({ name: 'album_photo_cap', type: 'int', default: 0 })
  albumPhotoCap: number;

  /**
   * Giá **Diamond Song Hỷ** — gói này cộng thiệp riêng nhà trai / nhà gái. Chỉ
   * hàng `diamond` có giá trị; `null` nghĩa là gói này không bán kèm Song Hỷ.
   * Nằm trên hàng của gói nền chứ không thành một bậc gói riêng: Song Hỷ không
   * mở thêm ảnh hay album nào, và `TIERS` còn là cấp thiết kế của mẫu.
   *
   * **Không có giá mua lại**: lần mua nào cũng là giá này. Thứ rẻ hơn duy nhất
   * là giá mua thêm cho thiệp đã trả Diamond (`familySplitUpgradePrice`).
   *
   * Khuyến mãi của Song Hỷ là cột **riêng** (`familySplitDiscountPercent`),
   * không mượn `discountPercent` của gói nền: vận hành hay đặt giá gốc cao rồi
   * giảm phần trăm để hiện giá gạch ngang, mượn chung thì giá Song Hỷ bị trừ
   * theo một chiến dịch không phải của nó.
   */
  @Column({ name: 'family_split_price', type: 'int', nullable: true })
  familySplitPrice: number | null;

  /** Khuyến mãi của Song Hỷ, phần trăm; `null` là không cấu hình — như `discountPercent`. */
  @Column({
    name: 'family_split_discount_percent',
    type: 'int',
    nullable: true,
  })
  familySplitDiscountPercent: number | null;

  /**
   * Giá **mua thêm** Song Hỷ cho thiệp đã trả tiền gói này rồi — khách không
   * trả lại phần Diamond đã trả.
   */
  @Column({ name: 'family_split_upgrade_price', type: 'int', nullable: true })
  familySplitUpgradePrice: number | null;

  /**
   * Gói được chọn nhiều nhất — thẻ mang nhãn "được chọn nhiều nhất". Cả bảng
   * giá chỉ có **một** thẻ mang nhãn này, tính chung với
   * `familySplitHighlighted` (`CatalogService.updateTierPrice` hạ cờ ở chỗ khác).
   */
  @Column({ type: 'boolean', default: false })
  highlighted: boolean;

  /**
   * Nhãn "được chọn nhiều nhất" đặt lên thẻ **Diamond Song Hỷ** thay vì thẻ
   * của gói. Cột riêng chứ không mượn `highlighted`: Song Hỷ là thẻ thứ tư
   * nhưng nằm trên hàng `diamond`, và `highlighted` của hàng đó đã là nhãn của
   * thẻ Diamond. Chỉ hàng `diamond` được bật.
   */
  @Column({
    name: 'family_split_highlighted',
    type: 'boolean',
    default: false,
  })
  familySplitHighlighted: boolean;

  /**
   * Bề mặt của thẻ trong bảng giá. Tách khỏi `highlighted` vì đây là quyết định
   * thị giác: gói bán chạy nhất và gói được vẽ nổi nhất không nhất thiết là một.
   */
  @Column({ type: 'varchar', length: 10, default: 'plain' })
  surface: 'plain' | 'gold' | 'dark';
}
