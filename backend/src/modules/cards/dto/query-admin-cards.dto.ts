import { CARD_STATUSES, INVITATION_KINDS } from '@common/enums/invitation.enum';
import type { CardStatus, InvitationKind } from '@common/enums/invitation.enum';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Bộ lọc bảng "thiệp đã tạo" của khu quản trị (spec mục 9). */
export class QueryAdminCardsDto {
  @IsOptional()
  @IsIn(CARD_STATUSES)
  status?: CardStatus;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  templateSlug?: string;

  /** Loại thiệp (`content.kind`); `wedding` gồm cả thiệp cũ không mang khoá. */
  @IsOptional()
  @IsIn(INVITATION_KINDS)
  kind?: InvitationKind;

  /** Tìm theo tiêu đề, đường dẫn hoặc email chủ thiệp. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

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

/** Bật/tắt việc trưng bày một thiệp thật ở trang chủ. */
export class SetCardShowcaseDto {
  @IsBoolean()
  showcasedOnHome: boolean;
}
