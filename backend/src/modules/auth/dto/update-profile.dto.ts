import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Chấp nhận số Việt Nam lẫn quốc tế: chữ số, khoảng trắng, +, (), ., -
const PHONE_RE = /^[0-9+\s().-]{8,20}$/;

/** Mọi trường đều tuỳ chọn — chỉ gửi trường muốn đổi. Email/role đi đường khác. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập họ và tên' })
  @MaxLength(255)
  fullName?: string;

  // Chuỗi rỗng hợp lệ và nghĩa là xoá số điện thoại (service đổi thành NULL).
  @ValidateIf((dto: UpdateProfileDto) => !!dto.phone)
  @IsString()
  @Matches(PHONE_RE, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  allowShowcase?: boolean;
}
