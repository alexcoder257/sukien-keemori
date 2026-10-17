import { ERROR_MESSAGES } from '@constant/error-messages';
import { IsEmail, Matches } from 'class-validator';

// Dashboard băm SHA-256 trước khi gửi, cùng quy ước với đăng nhập của khách.
const SHA256_HEX = /^[a-f0-9]{64}$/i;

export class AdminLoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @Matches(SHA256_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
  })
  password: string;
}
