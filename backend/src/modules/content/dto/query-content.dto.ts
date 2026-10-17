import { IsIn, IsOptional } from 'class-validator';
import type { ContentLocale } from '../content.service';

/**
 * Ngôn ngữ đang xem. Bỏ trống thì là `vi` — bản gốc, luôn có đủ nội dung.
 *
 * FAQ là text giao diện nên luôn có cả hai bản.
 */
export class QueryContentLocaleDto {
  @IsOptional()
  @IsIn(['vi', 'en'])
  locale?: ContentLocale;
}

export class QueryFaqDto extends QueryContentLocaleDto {}
