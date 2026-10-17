import { ERROR_MESSAGES } from '@constant/error-messages';
import { Matches } from 'class-validator';

// Client băm SHA-256 trước khi gửi, đúng như `login` và `reset-password` — mật
// khẩu thô không bao giờ rời khỏi trình duyệt.
const SHA256_HEX = /^[a-f0-9]{64}$/i;

export class ChangePasswordDto {
  @Matches(SHA256_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
  })
  currentPassword: string;

  @Matches(SHA256_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
  })
  newPassword: string;
}
