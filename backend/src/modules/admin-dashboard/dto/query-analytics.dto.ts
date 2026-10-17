import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Cửa sổ thời gian của biểu đồ lưu lượng, tính bằng ngày. */
export class QueryAnalyticsDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
