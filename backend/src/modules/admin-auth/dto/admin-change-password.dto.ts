import { ERROR_MESSAGES } from '@constant/error-messages';
import { Matches } from 'class-validator';

const SHA256_HEX = /^[a-f0-9]{64}$/i;

/**
 * Hai giá trị đều là SHA-256 nên backend không kiểm được độ mạnh của mật khẩu
 * mới — luật đó nằm ở schema của dashboard, đúng như luồng khách.
 */
export class AdminChangePasswordDto {
  @Matches(SHA256_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
  })
  currentPassword: string;

  @Matches(SHA256_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
  })
  newPassword: string;
}
