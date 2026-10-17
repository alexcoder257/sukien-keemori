import { ERROR_MESSAGES } from '@constant/error-messages';
import { AcceptedDocumentDto } from '@modules/legal/dto/accepted-document.dto';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

// Frontend băm mật khẩu bằng SHA-256 trước khi gửi → luôn là 64 ký tự hex.
const SHA256_HEX = /^[a-f0-9]{64}$/i;

// Giống `update-profile.dto.ts`: chữ số, khoảng trắng, +, (), ., -
const PHONE_RE = /^[0-9+\s().-]{8,20}$/;

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập họ và tên' })
  @MaxLength(255)
  fullName: string;

  // Trường duy nhất không bắt buộc: tài khoản tạo qua Google không có số điện
  // thoại, nên đăng ký bằng email cũng không ép nhập.
  @IsOptional()
  @IsString()
  @Matches(PHONE_RE, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @Matches(SHA256_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
  })
  password: string;

  /**
   * Các văn bản pháp lý người dùng đã chấp thuận ở màn đăng ký, kèm **phiên
   * bản họ nhìn thấy**. Bắt buộc: `AuthService.register` từ chối nếu thiếu
   * Điều khoản sử dụng hoặc Chính sách bảo mật.
   *
   * Ô tick ở frontend là trải nghiệm, không phải chốt chặn — gọi thẳng API vẫn
   * phải đi qua kiểm tra này.
   */
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => AcceptedDocumentDto)
  acceptedDocuments: AcceptedDocumentDto[];
}
