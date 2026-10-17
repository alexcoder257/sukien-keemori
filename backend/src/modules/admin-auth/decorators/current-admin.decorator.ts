import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { AdminUser } from '../admin-auth.types';

/**
 * Người vận hành đã xác thực bằng token CMS.
 * Dùng: `approve(@CurrentAdmin() actor: AdminUser)`
 */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AdminUser;
  },
);
