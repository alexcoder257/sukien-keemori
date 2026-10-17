import type { UserRole } from '@common/enums/user-role.enum';

// Payload nhúng trong access token.
export interface JwtPayload {
  sub: string; // user id
  email: string;
  // Nhúng role vào token để frontend chọn giao diện (khách/đối tác) mà khỏi
  // gọi thêm API. Đổi quyền chỉ có hiệu lực sau khi token hết hạn và refresh.
  role: UserRole;
}

// Object gắn vào req.user sau khi JwtStrategy.validate() chạy xong.
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

// Cặp token trả về cho client.
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
