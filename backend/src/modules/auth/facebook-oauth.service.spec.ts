import { createHmac } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FacebookOAuthService } from './facebook-oauth.service';

const ENV: Record<string, string> = {
  FACEBOOK_APP_ID: 'app-id',
  FACEBOOK_APP_SECRET: 'app-secret',
  FACEBOOK_CALLBACK_URL: 'http://localhost:3001/auth/facebook/callback',
  FRONTEND_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'test-secret',
};

function makeService(env: Record<string, string> = ENV) {
  const configService = {
    get: (key: string) => env[key],
  } as unknown as ConfigService;
  return new FacebookOAuthService(configService, new JwtService({}));
}

/** Giả lập cặp phản hồi Graph: đổi code → `/me`. */
function mockGraph(me: unknown, meOk = true) {
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: 'fb-token' }),
    })
    .mockResolvedValueOnce({
      ok: meOk,
      status: meOk ? 200 : 400,
      json: () => Promise.resolve(me),
    });
  global.fetch = fetchMock;
  return fetchMock;
}

describe('FacebookOAuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('không coi là đã cấu hình khi thiếu app id/secret', () => {
    expect(
      makeService({ ...ENV, FACEBOOK_APP_SECRET: '' }).isConfigured(),
    ).toBe(false);
    expect(makeService().isConfigured()).toBe(true);
  });

  it('dựng URL Facebook với redirect_uri và state đã ký', async () => {
    const service = makeService();

    const url = new URL(
      await service.buildAuthorizationUrl({
        locale: 'en',
        next: '/en/yeu-thich',
      }),
    );

    expect(url.origin + url.pathname).toBe(
      'https://www.facebook.com/v21.0/dialog/oauth',
    );
    expect(url.searchParams.get('client_id')).toBe('app-id');
    expect(url.searchParams.get('redirect_uri')).toBe(
      ENV.FACEBOOK_CALLBACK_URL,
    );
    expect(url.searchParams.get('scope')).toBe('public_profile,email');
    // State phải giải mã lại được nguyên vẹn ở bước callback.
    await expect(
      service.verifyState(url.searchParams.get('state') ?? undefined),
    ).resolves.toEqual({ locale: 'en', next: '/en/yeu-thich' });
  });

  it('đọc hồ sơ và ký appsecret_proof cho lời gọi Graph', async () => {
    const fetchMock = mockGraph({
      id: 'fb-1',
      name: 'Nguyễn Văn An',
      email: 'An@Example.com',
      picture: { data: { url: 'https://cdn.fb/anh.jpg' } },
    });

    const profile = await makeService().fetchProfile('code');

    expect(profile).toEqual({
      providerId: 'fb-1',
      email: 'an@example.com',
      emailVerified: true,
      fullName: 'Nguyễn Văn An',
      avatarUrl: 'https://cdn.fb/anh.jpg',
    });
    const meCall = fetchMock.mock.calls[1] as [string];
    const meUrl = new URL(meCall[0]);
    expect(meUrl.searchParams.get('appsecret_proof')).toBe(
      createHmac('sha256', 'app-secret').update('fb-token').digest('hex'),
    );
  });

  /** Ảnh mặc định của Facebook là hình bóng người — không đáng lưu. */
  it('bỏ ảnh đại diện mặc định', async () => {
    mockGraph({
      id: 'fb-1',
      name: 'An',
      email: 'an@example.com',
      picture: {
        data: { url: 'https://cdn.fb/silhouette.jpg', is_silhouette: true },
      },
    });

    await expect(makeService().fetchProfile('code')).resolves.toMatchObject({
      avatarUrl: undefined,
    });
  });

  /**
   * Nhánh riêng của Facebook: tài khoản đăng ký bằng số điện thoại, hoặc người
   * dùng bỏ tick quyền email, thì `/me` không trả email nào.
   */
  it('báo lỗi riêng khi tài khoản Facebook không có email', async () => {
    mockGraph({ id: 'fb-1', name: 'An' });

    await expect(makeService().fetchProfile('code')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
