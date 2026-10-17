import type { AdminPermission } from '@common/enums/admin-permission.enum';
import { ERROR_MESSAGES } from '@constant/error-messages';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { AdminUser } from '../admin-auth.types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Đối chiếu `req.user.permissions` với `@Permissions(...)`.
 *
 * Route quản trị **không khai** `@Permissions` thì bị chặn, không phải cho qua
 * (khác `RolesGuard` cũ): mọi thứ sau guard này là dữ liệu vận hành, và quên
 * khai quyền phải hỏng theo hướng đóng cửa.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      AdminPermission[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const request = context.switchToHttp().getRequest<Request>();
    const admin = request.user as AdminUser | undefined;
    if (
      !admin ||
      !required?.length ||
      !required.every((permission) => admin.permissions.includes(permission))
    ) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.FORBIDDEN);
    }
    return true;
  }
}
