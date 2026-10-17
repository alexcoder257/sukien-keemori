import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

/** Kỳ thống kê: 7, 30, 90 ngày gần nhất, hoặc `0` là từ trước tới nay. */
export const TEMPLATE_STATS_DAYS = [7, 30, 90, 0] as const;

export class QueryTemplateStatsDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsIn(TEMPLATE_STATS_DAYS)
  days?: (typeof TEMPLATE_STATS_DAYS)[number];
}
