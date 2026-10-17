import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  REVIEW_MAX_RATING,
  REVIEW_MIN_RATING,
} from '@common/constants/review.constants';

/** Bộ lọc bảng "đánh giá mẫu thiệp" của khu quản trị. */
export class QueryAdminTemplateReviewsDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  templateSlug?: string;

  /** Tìm trong nội dung nhận xét, tên và email người viết. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(REVIEW_MIN_RATING)
  @Max(REVIEW_MAX_RATING)
  rating?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(0)
  offset?: number;
}
