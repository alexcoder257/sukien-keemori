import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const toNumber = ({ value }: { value: unknown }): unknown =>
  value === undefined ? undefined : Number(value);

/** Hai chiều của lịch ngày cưới: sắp tới (gần nhất trước) và đã qua (mới nhất trước). */
export const WEDDING_SCOPES = ['upcoming', 'past'] as const;
export type WeddingScope = (typeof WEDDING_SCOPES)[number];

class AdminPageDto {
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class QueryUpcomingWeddingsDto extends AdminPageDto {
  @IsOptional()
  @IsIn(WEDDING_SCOPES)
  scope?: WeddingScope;

  /** Chỉ lấy đám cưới trong vòng chừng ấy ngày tính từ hôm nay; bỏ trống là không giới hạn. */
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(366)
  withinDays?: number;
}
