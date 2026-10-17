import { MAX_DISCOUNT_PERCENT } from '@common/pricing/discount';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';

/**
 * Cấu hình giá gói duy nhất. Cả hai trường **bắt buộc**: form CMS luôn gửi đủ,
 * và `discountPercent: null` là cách xoá khuyến mãi (bỏ trường đi thì không rõ
 * là "giữ" hay "xoá").
 */
export class UpdatePricingDto {
  @IsInt()
  @Min(0)
  price: number;

  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(MAX_DISCOUNT_PERCENT)
  discountPercent: number | null;
}
