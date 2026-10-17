import { IsJWT } from 'class-validator';

export class AdminRefreshTokenDto {
  @IsJWT({ message: 'Refresh token không hợp lệ' })
  refreshToken: string;
}
