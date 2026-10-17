import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  OAuthProfile,
  OAuthProviderService,
} from './oauth-provider.service';
import type { UserService } from '@modules/user/user.service';
import type { User } from '@modules/user/user.entity';

const PROFILE: OAuthProfile = {
  providerId: 'google-sub-1',
  email: 'an@example.com',
  emailVerified: true,
  fullName: 'Nguyễn Văn An',
  avatarUrl: 'https://lh3.googleusercontent.com/a/anh.jpg',
};

function user(partial: Partial<User> = {}): User {
  const now = new Date('2026-01-01T00:00:00Z');
  return {
    id: 'user-1',
    email: PROFILE.email,
    fullName: PROFILE.fullName,
    role: 'customer',
    passwordHash: null,
    refreshTokenHash: null,
    googleId: null,
    facebookId: null,
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...partial,
  };
}

/**
 * Chỉ dựng đủ phần AuthService mà nhánh Google chạm tới. `buildAuthResult` cần
 * jwtService + configService, nên hai thứ đó được giả lập tối thiểu.
 */
function makeService(userService: Partial<UserService>) {
  const jwtService = { signAsync: jest.fn().mockResolvedValue('token') };
  const configService = { get: jest.fn().mockReturnValue('secret') };
  // `legalService` phải là mock thật: nhánh tạo tài khoản mới qua OAuth ghi sổ
  // chấp thuận ngay sau khi tạo.
  const legalService = { record: jest.fn(), assertSignupDocuments: jest.fn() };
  return new AuthService(
    userService as UserService,
    jwtService as never,
    configService as never,
    {} as never,
    {} as never,
    legalService as never,
    {} as never,
    {} as never,
    {} as never,
    // `cardsService` và `auditService`: chỉ `deleteAccount` chạm tới, mà spec
    // này không kiểm nhánh đó. Mock thật khi nào có ca kiểm việc xoá tài khoản.
    {} as never,
    {} as never,
    { newUser: jest.fn() } as never,
  );
}

describe('AuthService.loginWithOAuth', () => {
  it('dùng tài khoản đã nối khoá OAuth, không đụng tới email', async () => {
    const findByEmailIncludingDeleted = jest.fn();
    const service = makeService({
      findByOAuthIdIncludingDeleted: jest
        .fn()
        .mockResolvedValue(user({ googleId: 'g' })),
      findByEmailIncludingDeleted,
      setRefreshTokenHash: jest.fn(),
    });

    const result = await service.loginWithOAuth('google', PROFILE);

    expect(result.user.id).toBe('user-1');
    expect(findByEmailIncludingDeleted).not.toHaveBeenCalled();
  });

  it('nối vào tài khoản email/mật khẩu sẵn có khi trùng email', async () => {
    const linkOAuthAccount = jest
      .fn()
      .mockResolvedValue(user({ googleId: PROFILE.providerId }));
    const create = jest.fn();
    const service = makeService({
      findByOAuthIdIncludingDeleted: jest.fn().mockResolvedValue(null),
      findByEmailIncludingDeleted: jest
        .fn()
        .mockResolvedValue(user({ passwordHash: 'x' })),
      linkOAuthAccount,
      create,
      setRefreshTokenHash: jest.fn(),
    });

    await service.loginWithOAuth('google', PROFILE);

    expect(linkOAuthAccount).toHaveBeenCalledWith(
      'user-1',
      'google',
      PROFILE.providerId,
      PROFILE.avatarUrl,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('tạo tài khoản mới không có mật khẩu khi email chưa tồn tại', async () => {
    const create = jest.fn().mockResolvedValue(user());
    const service = makeService({
      findByOAuthIdIncludingDeleted: jest.fn().mockResolvedValue(null),
      findByEmailIncludingDeleted: jest.fn().mockResolvedValue(null),
      create,
      setRefreshTokenHash: jest.fn(),
    });

    await service.loginWithOAuth('google', PROFILE);

    expect(create).toHaveBeenCalledWith({
      email: PROFILE.email,
      fullName: PROFILE.fullName,
      googleId: PROFILE.providerId,
      avatarUrl: PROFILE.avatarUrl,
    });
    expect(create).not.toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: expect.anything() as unknown }),
    );
  });

  /**
   * Tài khoản bị admin vô hiệu hoá (soft delete) phải chặn cả ở đường Google.
   * Đường mật khẩu tự chặn vì repository không thấy hàng đã xoá, còn đường này
   * cố tình tra `withDeleted` nên phải tự kiểm.
   */
  it('từ chối tài khoản đã bị vô hiệu hoá, không tạo tài khoản mới', async () => {
    const create = jest.fn();
    const linkOAuthAccount = jest.fn();
    const service = makeService({
      findByOAuthIdIncludingDeleted: jest.fn().mockResolvedValue(null),
      findByEmailIncludingDeleted: jest
        .fn()
        .mockResolvedValue(user({ deletedAt: new Date() })),
      linkOAuthAccount,
      create,
    });

    await expect(
      service.loginWithOAuth('google', PROFILE),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(linkOAuthAccount).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  /**
   * Nhánh quan trọng nhất về bảo mật: email chưa xác minh mà vẫn cho nối thì
   * ai đăng ký một địa chỉ bất kỳ bên Google cũng chiếm được tài khoản.
   */
  it('từ chối khi Google báo email chưa xác minh', async () => {
    const linkOAuthAccount = jest.fn();
    const create = jest.fn();
    const service = makeService({
      findByOAuthIdIncludingDeleted: jest.fn().mockResolvedValue(null),
      findByEmailIncludingDeleted: jest
        .fn()
        .mockResolvedValue(user({ passwordHash: 'x' })),
      linkOAuthAccount,
      create,
    });

    await expect(
      service.loginWithOAuth('google', { ...PROFILE, emailVerified: false }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(linkOAuthAccount).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});

/**
 * Nhánh Facebook chỉ khác một chỗ: khoá nối rơi vào cột `facebook_id`. Nếu nó
 * lại ghi vào `google_id` thì unique index của Google sẽ va nhau giữa hai
 * người dùng Facebook khác nhau.
 */
describe('AuthService.loginWithOAuth — facebook', () => {
  it('lưu khoá nối vào facebookId khi tạo tài khoản mới', async () => {
    const create = jest.fn().mockResolvedValue(user());
    const service = makeService({
      findByOAuthIdIncludingDeleted: jest.fn().mockResolvedValue(null),
      findByEmailIncludingDeleted: jest.fn().mockResolvedValue(null),
      create,
      setRefreshTokenHash: jest.fn(),
    });

    await service.loginWithOAuth('facebook', {
      ...PROFILE,
      providerId: 'fb-1',
    });

    expect(create).toHaveBeenCalledWith({
      email: PROFILE.email,
      fullName: PROFILE.fullName,
      facebookId: 'fb-1',
      avatarUrl: PROFILE.avatarUrl,
    });
  });

  /** Cùng email = cùng người: nối thêm khoá, không tạo tài khoản thứ hai. */
  it('nối vào tài khoản đã đăng nhập bằng Google khi trùng email', async () => {
    const linkOAuthAccount = jest
      .fn()
      .mockResolvedValue(user({ facebookId: 'fb-1' }));
    const create = jest.fn();
    const service = makeService({
      findByOAuthIdIncludingDeleted: jest.fn().mockResolvedValue(null),
      findByEmailIncludingDeleted: jest
        .fn()
        .mockResolvedValue(user({ googleId: 'google-sub-1' })),
      linkOAuthAccount,
      create,
      setRefreshTokenHash: jest.fn(),
    });

    await service.loginWithOAuth('facebook', {
      ...PROFILE,
      providerId: 'fb-1',
    });

    expect(linkOAuthAccount).toHaveBeenCalledWith(
      'user-1',
      'facebook',
      'fb-1',
      PROFILE.avatarUrl,
    );
    expect(create).not.toHaveBeenCalled();
  });
});

describe('AuthService.handleOAuthCallback', () => {
  function makeWithOAuth(googleOAuth: Partial<OAuthProviderService>) {
    const service = makeService({});
    // googleOAuthService là tham số thứ 6 của constructor; ghi đè trực tiếp
    // gọn hơn dựng lại cả DI container cho một nhánh redirect.
    (service as unknown as { googleOAuthService: unknown }).googleOAuthService =
      googleOAuth;
    return service;
  }

  it('quay về trang đăng nhập với lỗi state khi state không hợp lệ', async () => {
    const buildFailureRedirect = jest.fn().mockReturnValue('/vi/dang-nhap');
    const service = makeWithOAuth({
      tryVerifyState: jest.fn().mockResolvedValue(null),
      buildFailureRedirect,
    });

    await service.handleOAuthCallback('google', { state: 'hỏng', code: 'abc' });

    expect(buildFailureRedirect).toHaveBeenCalledWith(
      { locale: 'vi' },
      'state',
    );
  });

  it('báo cancelled khi người dùng huỷ ở màn hình Google', async () => {
    const buildFailureRedirect = jest.fn().mockReturnValue('/en/dang-nhap');
    const service = makeWithOAuth({
      tryVerifyState: jest.fn().mockResolvedValue({ locale: 'en' }),
      buildFailureRedirect,
    });

    await service.handleOAuthCallback('google', {
      state: 'ok',
      error: 'access_denied',
    });

    expect(buildFailureRedirect).toHaveBeenCalledWith(
      { locale: 'en' },
      'cancelled',
    );
  });
});
