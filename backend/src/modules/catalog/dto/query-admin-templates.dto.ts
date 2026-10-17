import { PaginationDto } from '@common/dto/pagination.dto';
import { TIERS } from '@common/enums/tier.enum';
import type { Tier } from '@common/enums/tier.enum';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Bộ lọc kho mẫu ở CMS (màn "Tag mẫu thiệp").
 *
 * Lọc ở backend chứ không lọc sau khi đã cắt trang: lọc trong trang chỉ tìm
 * được trong 20 mẫu đang hiện, và người vận hành sẽ kết luận nhầm là mẫu không
 * tồn tại.
 *
 * Khác `QueryTemplatesDto` của trang khách: bản kia lọc theo nhiều tier và
 * nhiều phong cách cùng lúc cho bộ lọc kho mẫu công khai, còn ở đây là một ô
 * tìm tên và một ô chọn bậc.
 */
export class QueryAdminTemplatesDto extends PaginationDto {
  /** Tìm theo tên hoặc đường dẫn mẫu. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(TIERS)
  tier?: Tier;
}
