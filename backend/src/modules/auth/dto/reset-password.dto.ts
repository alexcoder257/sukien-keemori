import { ERROR_MESSAGES } from '@constant/error-messages';
import { IsString, Length, Matches } from 'class-validator';

// Frontend băm mật khẩu bằng SHA-256 trước khi gửi → luôn là 64 ký tự hex.
const SHA256_HEX = /^[a-f0-9]{64}$/i;
// Token sinh từ crypto.randomBytes(32) → 64 ký tự hex.
const TOKEN_HEX = /^[a-f0-9]{64}$/i;

export class ResetPasswordDto {
  @IsString()
  @Length(64, 64)
  @Matches(TOKEN_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_RESET_TOKEN,
  })
  token: string;

  @Matches(SHA256_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
  })
  password: string;
}
