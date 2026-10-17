import { ERROR_MESSAGES } from '@constant/error-messages';
import { IsEmail, Matches } from 'class-validator';

const SHA256_HEX = /^[a-f0-9]{64}$/i;

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @Matches(SHA256_HEX, {
    message: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
  })
  password: string;
}
