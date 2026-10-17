import { ADMIN_ROLE_PERMISSIONS } from '@common/enums/admin-role.enum';
import { ERROR_MESSAGES } from '@constant/error-messages';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { AdminUserEntity } from './admin-user.entity';
import { AdminUserRepository } from './admin-user.repository';
import { adminJwtSecret } from './admin-jwt-secret';
import {
  ADMIN_TOKEN_TYPE,
  type AdminAuthTokens,
  type AdminJwtPayload,
  type AdminProfile,
} from './admin-auth.types';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

const BCRYPT_ROUNDS = 10;

/** Token 15 phút; phiên tối đa 10 tiếng rồi phải đăng nhập lại. */
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 10 * 60 * 60;

/**
 * Hash giả để `bcrypt.compare` vẫn chạy khi email không tồn tại — trả lời
 * nhanh hơn hẳn ở nhánh đó là cách dò ra email nào là tài khoản quản trị.
 */
const DUMMY_HASH =
  '$2b$10$a2imCCslYgOHgjmOl.h3N.C4XRZc9GYMVTjNK2XrzE/VkKVgNmpcm';

/**
 * Refresh token lưu dạng SHA-256, **không** bcrypt: bcrypt chỉ đọc 72 byte đầu,
 * mà mọi JWT của cùng một tài khoản trùng nhau đúng ở phần đầu (header + `sub`
 * + `email`) — so bằng bcrypt thì token cũ đã xoay vòng vẫn "khớp". Token là
 * chuỗi ngẫu nhiên dài nên không cần hàm băm chậm.
 */
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshTokenMatches(token: string, storedHash: string): boolean {
  const actual = Buffer.from(hashRefreshToken(token), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly adminUsers: AdminUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto): Promise<AdminAuthTokens> {
    const admin = await this.adminUsers.findByEmailWithPassword(dto.email);
    const matches = await bcrypt.compare(
      dto.password,
      admin?.passwordHash ?? DUMMY_HASH,
    );
    // Tài khoản bị tắt trả cùng lời như sai mật khẩu: người đoán mật khẩu
    // không được biết mình vừa đoán trúng một tài khoản đã khoá.
    if (!admin || !matches || !admin.isActive) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    await this.adminUsers.markLoggedIn(admin.id);
    return this.issueTokens(admin);
  }

  /** Xoay vòng: refresh token cũ thành vô hiệu ngay khi cặp mới được cấp. */
  async refresh(refreshToken: string): Promise<AdminAuthTokens> {
    let payload: AdminJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<AdminJwtPayload>(
        refreshToken,
        {
          secret: adminJwtSecret(this.configService, 'refresh'),
          algorithms: ['HS256'],
        },
      );
    } catch {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }
    if (payload.typ !== ADMIN_TOKEN_TYPE) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    const admin = await this.adminUsers.findByIdWithRefreshToken(payload.sub);
    const valid =
      !!admin?.refreshTokenHash &&
      admin.isActive &&
      refreshTokenMatches(refreshToken, admin.refreshTokenHash);
    if (!admin || !valid) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }
    return this.issueTokens(admin);
  }

  async logout(adminId: string): Promise<void> {
    await this.adminUsers.setRefreshTokenHash(adminId, null);
  }

  async getProfile(adminId: string): Promise<AdminProfile> {
    const admin = await this.adminUsers.findActiveById(adminId);
    if (!admin) throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: [...ADMIN_ROLE_PERMISSIONS[admin.role]],
      lastLoginAt: admin.lastLoginAt,
    };
  }

  /**
   * Đổi mật khẩu thu hồi refresh token: mọi phiên — kể cả phiên đang dùng —
   * phải đăng nhập lại bằng mật khẩu mới. Lý do phổ biến nhất để đổi mật khẩu
   * là nghi ngờ có người khác đang dùng tài khoản.
   */
  async changePassword(
    adminId: string,
    dto: AdminChangePasswordDto,
  ): Promise<void> {
    const admin = await this.adminUsers.findByIdWithPassword(adminId);
    if (!admin) throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);

    const matches = await bcrypt.compare(
      dto.currentPassword,
      admin.passwordHash,
    );
    if (!matches) {
      // 400 chứ không 401: 401 khiến `apis/http.ts` của dashboard tưởng token
      // hết hạn, đi làm mới phiên rồi gửi lại, và người dùng không bao giờ
      // thấy câu "mật khẩu hiện tại không đúng".
      throw new BadRequestException(ERROR_MESSAGES.AUTH.WRONG_CURRENT_PASSWORD);
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.SAME_PASSWORD);
    }

    await this.adminUsers.setPasswordHash(
      adminId,
      await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
    );
  }

  private async issueTokens(admin: AdminUserEntity): Promise<AdminAuthTokens> {
    const payload: AdminJwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      typ: ADMIN_TOKEN_TYPE,
      permissions: [...ADMIN_ROLE_PERMISSIONS[admin.role]],
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: adminJwtSecret(this.configService, 'access'),
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      }),
      // `jwtid` ngẫu nhiên: hai lần cấp trong cùng một giây vẫn ra hai token
      // khác nhau, nên token vừa bị thay luôn thật sự hết hiệu lực.
      this.jwtService.signAsync(payload, {
        secret: adminJwtSecret(this.configService, 'refresh'),
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        jwtid: randomUUID(),
      }),
    ]);
    await this.adminUsers.setRefreshTokenHash(
      admin.id,
      hashRefreshToken(refreshToken),
    );
    return {
      accessToken,
      refreshToken,
      refreshExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
    };
  }
}
