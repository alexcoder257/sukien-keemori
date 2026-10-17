import {
  REVIEW_MAX_COMMENT_LENGTH,
  REVIEW_MAX_RATING,
  REVIEW_MIN_RATING,
} from '@common/constants/review.constants';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Gửi hoặc sửa đánh giá của chính mình cho một mẫu. Cùng một body cho cả hai
 * việc: route là `PUT` vì gửi lại là ghi đè đánh giá cũ, không tạo thêm bản.
 */
export class UpsertTemplateReviewDto {
  @IsInt()
  @Min(REVIEW_MIN_RATING)
  @Max(REVIEW_MAX_RATING)
  rating: number;

  /**
   * Chuỗi rỗng và chuỗi chỉ có khoảng trắng đều quy về `null`: "chấm sao mà
   * không viết gì" phải lưu thành một giá trị duy nhất, nếu không danh sách sẽ
   * có những nhận xét trống hiện ra như ô trắng.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() ? value.trim() : null,
  )
  @IsString()
  @MaxLength(REVIEW_MAX_COMMENT_LENGTH)
  comment?: string | null;
}
