import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Như `JwtAuthGuard` nhưng **không chặn khi thiếu token**: có token hợp lệ thì
 * gắn `request.user`, không có thì cho đi tiếp với `user` rỗng.
 *
 * Dùng cho route vừa phục vụ khách chưa đăng nhập vừa cần biết ai đang gọi khi
 * họ có đăng nhập — ví dụ gợi ý địa điểm: khách vãng lai vẫn soạn thử thiệp
 * được, còn hạn mức theo tài khoản chỉ áp cho người đã đăng nhập.
 *
 * Token **hỏng** cũng không ném: với route kiểu này, một token hết hạn không
 * phải lý do để từ chối phục vụ.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
