import { USER_ROLES } from '@common/enums/user-role.enum';
import type { UserRole } from '@common/enums/user-role.enum';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueryUsersDto {
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole;

  /** Tìm theo email hoặc họ tên — ô tìm kiếm duy nhất của bảng người dùng. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(0)
  offset?: number;
}
