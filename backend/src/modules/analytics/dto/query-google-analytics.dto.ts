import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Cửa sổ thời gian của báo cáo Google Analytics, tính bằng ngày.
 *
 * Trần 365 ngày khớp `QueryAnalyticsDto` của `admin-dashboard` để hai khối
 * trong cùng một màn nhận cùng một bộ lựa chọn.
 */
export class QueryGoogleAnalyticsDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
