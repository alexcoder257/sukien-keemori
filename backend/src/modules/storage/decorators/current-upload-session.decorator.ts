import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithUploadSession } from '../guards/upload-session.guard';
import type { UploadSession } from '../upload-session.entity';

/** Phiên tải lên đã được `UploadSessionGuard` xác thực. */
export const CurrentUploadSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UploadSession => {
    const request = ctx.switchToHttp().getRequest<RequestWithUploadSession>();
    return request.uploadSession as UploadSession;
  },
);
