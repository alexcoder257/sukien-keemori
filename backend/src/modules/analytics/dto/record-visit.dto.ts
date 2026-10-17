import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Một lượt truy cập do trình duyệt báo lên. Không có định danh nào ở đây —
 * `isNewVisitor` là cờ do chính trình duyệt tự quyết, xem `DailyVisit`.
 */
export class RecordVisitDto {
  @IsOptional()
  @IsBoolean()
  isNewVisitor?: boolean;
}
