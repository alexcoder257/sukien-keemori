import { PaginationDto } from '@common/dto/pagination.dto';
import { ORDER_STATUSES } from '@modules/commerce/order.entity';
import type { OrderStatus } from '@modules/commerce/order.entity';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Tra cứu đơn mua thiệp ở CMS. `q` là **một ô duy nhất** cho mọi thứ người
 * vận hành có trong tay khi khách báo sự cố: mã đơn (in trong nội dung chuyển
 * khoản), email, họ tên, đường dẫn thiệp, mã voucher, mã tham chiếu ngân hàng.
 * Bắt họ chọn trước "đang tìm theo gì" là thêm một bước vào đúng lúc đang vội.
 */
export class QueryAdminOrdersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  /**
   * Khoảng ngày tạo đơn, `YYYY-MM-DD`, **tính theo giờ Việt Nam** và gồm cả
   * hai đầu. Người vận hành nghĩ theo "ngày 15" của lịch treo tường, không
   * theo UTC — lệch 7 tiếng là đơn lúc 6 giờ sáng rơi sang ngày hôm trước.
   */
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;
}

/** Hàng đợi tiền vào chưa ghép — tìm theo nội dung, mã tham chiếu, số tiền. */
export class QueryUnmatchedDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
