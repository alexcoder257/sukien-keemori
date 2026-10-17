import { ADMIN_ROLE_PERMISSIONS } from '@common/enums/admin-role.enum';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminUserRepository } from '../admin-user.repository';
import { adminJwtSecret } from '../admin-jwt-secret';
import {
  ADMIN_TOKEN_TYPE,
  type AdminJwtPayload,
  type AdminUser,
} from '../admin-auth.types';

export const ADMIN_JWT_STRATEGY = 'admin-jwt';

/**
 * Xác thực access token CMS (HS256, secret riêng — `adminJwtSecret`).
 *
 * Tra lại `admin_users` ở **mỗi** request: bảng nhỏ, CMS ít người dùng, và đổi
 * lại tài khoản bị tắt hay bị đổi vai trò có hiệu lực ngay chứ không đợi token
 * 15 phút hết hạn. Quyền bung từ vai trò **trong database**, không từ claim
 * `permissions` của token.
 */
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  ADMIN_JWT_STRATEGY,
) {
  constructor(
    configService: ConfigService,
    private readonly adminUsers: AdminUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: adminJwtSecret(configService, 'access'),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminUser> {
    if (payload.typ !== ADMIN_TOKEN_TYPE) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
    const admin = await this.adminUsers.findActiveById(payload.sub);
    if (!admin) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
    return {
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: [...ADMIN_ROLE_PERMISSIONS[admin.role]],
    };
  }
}
