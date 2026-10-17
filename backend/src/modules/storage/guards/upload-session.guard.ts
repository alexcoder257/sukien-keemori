import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { UploadSession } from '../upload-session.entity';
import { UploadStagingService } from '../upload-staging.service';

/** Header mang token phiên tải lên (`<id>.<secret>`). */
export const UPLOAD_SESSION_HEADER = 'x-upload-session';

export type RequestWithUploadSession = Request & {
  uploadSession?: UploadSession;
};

/**
 * Xác thực **phiên tải lên**, không phải tài khoản — route ảnh của editor mở
 * cho cả khách chưa đăng nhập. Route nào cần thêm tài khoản (nhận ảnh về thiệp)
 * thì đặt `JwtAuthGuard` trước guard này.
 */
@Injectable()
export class UploadSessionGuard implements CanActivate {
  constructor(private readonly staging: UploadStagingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithUploadSession>();
    const header = request.headers[UPLOAD_SESSION_HEADER];
    request.uploadSession = await this.staging.authenticate(
      Array.isArray(header) ? header[0] : header,
    );
    return true;
  }
}
