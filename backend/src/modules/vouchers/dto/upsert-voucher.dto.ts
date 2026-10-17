import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { VOUCHER_DISCOUNT_TYPES, VOUCHER_PLANS } from '../voucher.entity';
import type { VoucherDiscountType, VoucherPlan } from '../voucher.entity';

/**
 * Chuẩn hoá mã ngay ở biên: bỏ khoảng trắng, viết hoa. Làm ở DTO chứ không ở
 * service để cả đường tạo mã (admin) lẫn đường tra mã (khách) đi qua đúng một
 * phép biến đổi — lệch nhau một chỗ là mã tạo ra không tra lại được.
 */
export function normalizeCode(value: unknown): unknown {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, '').toUpperCase()
    : value;
}

export class CreateVoucherDto {
  @Transform(({ value }) => normalizeCode(value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @IsIn(VOUCHER_DISCOUNT_TYPES)
  discountType: VoucherDiscountType;

  /**
   * Trần đúng bằng 100 chỉ có nghĩa với mã phần trăm; mã trừ thẳng tiền thì con
   * số là VND nên không có trần nào ở đây — `applyAmount` đã chặn giá âm.
   */
  @IsInt()
  @Min(1)
  discountValue: number;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(0)
  maxDiscount?: number | null;

  /** Cột di sản: chỉ còn một gói nên giá trị được nhận nhưng bị bỏ qua. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(VOUCHER_PLANS, { each: true })
  tiers?: VoucherPlan[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601()
  expiresAt?: string | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(1)
  perUserLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  /**
   * Cột di sản của chương trình đối tác (đã gỡ): CMS vẫn gửi `null`, nhận rồi bỏ
   * qua để `forbidNonWhitelisted` không từ chối.
   */
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  partnerStoreId?: string | null;
}

/**
 * Sửa mã. `code` **không** sửa được: mã đã phát ra ngoài thì đổi chữ là làm
 * chết mọi tờ rơi và tin nhắn đã gửi đi. Cần mã khác thì tắt mã cũ, tạo mã mới.
 */
export class UpdateVoucherDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @IsOptional()
  @IsIn(VOUCHER_DISCOUNT_TYPES)
  discountType?: VoucherDiscountType;

  @IsOptional()
  @IsInt()
  @Min(1)
  discountValue?: number;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(0)
  maxDiscount?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(VOUCHER_PLANS, { each: true })
  tiers?: VoucherPlan[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601()
  expiresAt?: string | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(1)
  perUserLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  /**
   * Cột di sản của chương trình đối tác (đã gỡ): CMS vẫn gửi `null`, nhận rồi bỏ
   * qua để `forbidNonWhitelisted` không từ chối.
   */
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  partnerStoreId?: string | null;
}
