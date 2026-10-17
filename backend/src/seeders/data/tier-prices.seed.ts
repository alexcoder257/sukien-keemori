import { ALBUM_PHOTO_CAP } from '@common/constants/invitation.constants';
import type { TierPrice } from '@modules/pricing/tier-price.entity';

/** Giá gói thiệp duy nhất (VND), giá niêm yết ban đầu. */
export const PACKAGE_PRICE = 899_000;

export type TierPriceSeed = Pick<
  TierPrice,
  | 'tier'
  | 'price'
  | 'repeatPrice'
  | 'albumEnabled'
  | 'albumPhotoCap'
  | 'highlighted'
  | 'surface'
>;

/**
 * Chỉ **một hàng**: gói duy nhất nằm ở `tier = 'diamond'` (cột `tier` là di
 * sản). Admin đổi giá qua `PATCH /admin/pricing`, và seeder **không** ghi đè
 * hàng đã có để không thổi bay cấu hình thật khi chạy lại.
 */
export const TIER_PRICE_SEEDS: TierPriceSeed[] = [
  {
    tier: 'diamond',
    price: PACKAGE_PRICE,
    // Cột di sản (giá mua lại đã bỏ), NOT NULL nên vẫn phải có giá trị.
    repeatPrice: PACKAGE_PRICE,
    albumEnabled: true,
    albumPhotoCap: ALBUM_PHOTO_CAP,
    highlighted: false,
    surface: 'dark',
  },
];
