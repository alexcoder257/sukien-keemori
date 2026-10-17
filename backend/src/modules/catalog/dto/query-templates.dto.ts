import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_COLORS,
} from '@common/enums/invitation.enum';
import type {
  TemplateCategory,
  TemplateColor,
} from '@common/enums/invitation.enum';
import { TIERS } from '@common/enums/tier.enum';
import type { Tier } from '@common/enums/tier.enum';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Tách `?tier=gold,diamond` thành mảng; giá trị lạ bị DTO loại ở bước IsIn. */
const toArray = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : value;

export class QueryTemplatesDto {
  @IsOptional()
  @Transform(toArray)
  @IsIn(TIERS, { each: true })
  tier?: Tier[];

  @IsOptional()
  @Transform(toArray)
  @IsIn(TEMPLATE_CATEGORIES, { each: true })
  category?: TemplateCategory[];

  /** Ghép bằng AND: `?color=white,green` chỉ ra mẫu mang **cả hai** màu. */
  @IsOptional()
  @Transform(toArray)
  @IsIn(TEMPLATE_COLORS, { each: true })
  color?: TemplateColor[];

  /** Dùng cho khối "mẫu nổi bật" ở trang chủ (mặc định 4 mẫu đầu). */
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
