import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  AUDIT_ACTIONS,
  type AuditAction,
} from '@common/enums/audit-action.enum';

/** Bộ lọc bảng nhật ký thao tác của khu quản trị. */
export class QueryAuditLogsDto {
  @IsOptional()
  @IsIn(AUDIT_ACTIONS)
  action?: AuditAction;

  /** Lọc theo người thao tác. */
  @IsOptional()
  @IsUUID()
  actorId?: string;

  /**
   * Lọc theo đối tượng bị tác động — đây là đường dùng nhiều nhất khi có sự cố:
   * cầm id của tài khoản đã biến mất, hỏi "đã có chuyện gì xảy ra với nó".
   */
  @IsOptional()
  @IsUUID()
  targetId?: string;

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
