import { IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @IsJWT({ message: 'Refresh token không hợp lệ' })
  refreshToken: string;
}
