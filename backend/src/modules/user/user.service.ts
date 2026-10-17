import type { OAuthProvider } from '@common/enums/oauth-provider.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService, type AuditActor } from '@modules/audit/audit.service';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { QueryUsersDto } from './dto/query-users.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

interface CreateUserData {
  email: string;
  fullName: string;
  // Vắng mặt khi tài khoản được tạo qua OAuth — người dùng chưa đặt mật khẩu.
  passwordHash?: string;
  // Tuỳ chọn ở form đăng ký; tài khoản OAuth không bao giờ có.
  phone?: string;
  googleId?: string;
  facebookId?: string;
  avatarUrl?: string;
}

/**
 * Cột khoá nối tương ứng từng nhà cung cấp. Bảng này là chỗ duy nhất ánh xạ
 * `provider` → cột, nên thêm nhà cung cấp mới chỉ phải sửa ở đây (và thêm cột).
 */
const OAUTH_ID_COLUMN = {
  google: 'googleId',
  facebook: 'facebookId',
} as const satisfies Record<OAuthProvider, keyof User>;

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService,
  ) {}

  create(data: CreateUserData): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  /** Tổng số tài khoản — `admin-dashboard` dùng cho thẻ số liệu. */
  countAll(): Promise<number> {
    return this.userRepository.count();
  }

  /** Bảng người dùng trong CMS. Mặc định 50 dòng — vừa một màn hình. */
  search(query: QueryUsersDto): Promise<{ items: User[]; total: number }> {
    return this.userRepository.search({
      role: query.role,
      q: query.q?.trim() || undefined,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
  }

  /** Hồ sơ kèm `passwordHash` — chỉ dùng ở đường đổi mật khẩu. */
  findByIdWithSecret(id: string): Promise<User | null> {
    return this.userRepository.findByIdWithSecret(id);
  }

  /** Các trường hồ sơ người dùng tự sửa được — không bao giờ gồm email/role. */
  async updateProfile(
    id: string,
    data: Partial<{
      fullName: string;
      phone: string | null;
      emailNotifications: boolean;
      allowShowcase: boolean;
    }>,
  ): Promise<User> {
    const user = await this.findByIdOrFail(id);
    if (Object.keys(data).length > 0) {
      await this.userRepository.update(user.id, data);
    }
    return { ...user, ...data };
  }

  /** Xoá tài khoản; dữ liệu liên quan đi theo FK CASCADE. */
  async deleteAccount(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  /**
   * Vô hiệu hoá tài khoản từ CMS — soft delete (xem `User.deletedAt`).
   *
   * Thu hồi refresh token trong cùng thao tác: guard chặn được request tiếp
   * theo, nhưng access token đã phát vẫn sống tới lúc hết hạn nếu không cắt
   * đường làm mới.
   *
   * Không cần chặn "tự xoá chính mình" hay "xoá một admin": người vận hành là
   * một hàng trong `admin_users`, không phải trong bảng này, nên route này
   * không bao giờ chạm được tới tài khoản quản trị nào.
   */
  async softDelete(actor: AuditActor, targetId: string): Promise<void> {
    const user = await this.findByIdOrFail(targetId);
    await this.userRepository.update(user.id, { refreshTokenHash: null });
    await this.userRepository.softDelete(user.id);

    // `user.disabled`, không phải `user.self_deleted`: đây là soft delete, dữ
    // liệu và ảnh **còn nguyên**. Gộp hai loại vào một hành động thì lúc tra
    // soát không phân biệt được "tài khoản còn khôi phục được" với "đã mất
    // hẳn" — mà đó đúng là câu hỏi đầu tiên người ta hỏi.
    await this.auditService.record({
      action: 'user.disabled',
      actor,
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.email,
      metadata: { role: user.role },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /** Gồm cả tài khoản đã bị xoá mềm — xem `UserRepository`. */
  findByEmailIncludingDeleted(email: string): Promise<User | null> {
    return this.userRepository.findByEmailIncludingDeleted(email);
  }

  /** Tra theo khoá nối OAuth, gồm cả tài khoản đã bị xoá mềm. */
  findByOAuthIdIncludingDeleted(
    provider: OAuthProvider,
    providerId: string,
  ): Promise<User | null> {
    return provider === 'google'
      ? this.userRepository.findByGoogleIdIncludingDeleted(providerId)
      : this.userRepository.findByFacebookIdIncludingDeleted(providerId);
  }

  findByEmailWithSecret(email: string): Promise<User | null> {
    return this.userRepository.findByEmailWithSecret(email);
  }

  /**
   * Nối tài khoản email/mật khẩu sẵn có với một tài khoản OAuth cùng email.
   * Chỉ gọi khi nhà cung cấp đã xác nhận email — nếu không, ai đăng ký một địa
   * chỉ bất kỳ bên đó cũng chiếm được tài khoản của người khác.
   */
  async linkOAuthAccount(
    id: string,
    provider: OAuthProvider,
    providerId: string,
    avatarUrl?: string,
  ): Promise<User> {
    await this.userRepository.update(id, {
      [OAUTH_ID_COLUMN[provider]]: providerId,
      ...(avatarUrl ? { avatarUrl } : {}),
    });
    return this.findByIdOrFail(id);
  }

  /**
   * Người nhận email nhắc việc (thiệp sắp bị xoá...), theo id. Bỏ qua tài
   * khoản đã tắt `emailNotifications` — đúng như lời hứa ở màn Tài khoản
   * ("nhận email về thanh toán...") — và tài khoản đã xoá. Người bị bỏ qua vẫn
   * nhận thông báo trong chuông.
   */
  async findMailRecipients(
    ids: string[],
  ): Promise<Map<string, { email: string; fullName: string }>> {
    const users = await this.userRepository.findMailRecipients([
      ...new Set(ids),
    ]);
    return new Map(
      users
        .filter((user) => user.emailNotifications)
        .map((user) => [
          user.id,
          { email: user.email, fullName: user.fullName },
        ]),
    );
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }
    return user;
  }

  findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.userRepository.findByIdWithRefreshToken(id);
  }

  async setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.userRepository.update(id, { refreshTokenHash: hash });
  }

  /**
   * Đổi mật khẩu và thu hồi refresh token hiện hành — đổi mật khẩu đồng nghĩa
   * với đăng xuất khỏi mọi thiết bị đang đăng nhập.
   */
  async setPasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, {
      passwordHash,
      refreshTokenHash: null,
    });
  }
}
