import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { SITE_STAT_KEYS } from '../site-stat.entity';

/** Một dòng số liệu: khoá cố định, chỉ giá trị là thứ CMS sửa được. */
export class SiteStatItemDto {
  @IsIn(SITE_STAT_KEYS)
  key: string;

  /**
   * `maxDecimalPlaces: 2` khớp `numeric(12,2)` của cột: gửi nhiều chữ số hơn
   * thì Postgres tự làm tròn và người vận hành thấy một con số khác thứ vừa gõ.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9_999_999_999)
  value: number;
}

/**
 * Lưu cả dải một lần: form CMS hiện đủ các số liệu cạnh nhau, nên "Lưu" là một
 * request chứ không phải sáu.
 */
export class UpdateSiteStatsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(SITE_STAT_KEYS.length)
  @ValidateNested({ each: true })
  @Type(() => SiteStatItemDto)
  stats: SiteStatItemDto[];
}
