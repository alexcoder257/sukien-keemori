import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleOAuthService } from './google-oauth.service';

const ENV: Record<string, string> = {
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3001/auth/google/callback',
  FRONTEND_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'test-secret',
};

function makeService(env: Record<string, string> = ENV) {
  const configService = {
    get: (key: string) => env[key],
  } as unknown as ConfigService;
  return new GoogleOAuthService(configService, new JwtService({}));
}

describe('GoogleOAuthService', () => {
  it('không coi là đã cấu hình khi thiếu client id/secret', () => {
    expect(
      makeService({ ...ENV, GOOGLE_CLIENT_SECRET: '' }).isConfigured(),
    ).toBe(false);
    expect(makeService().isConfigured()).toBe(true);
  });

  it('dựng URL Google với redirect_uri và state đã ký', async () => {
    const service = makeService();

    const url = new URL(
      await service.buildAuthorizationUrl({
        locale: 'en',
        next: '/en/yeu-thich',
      }),
    );

    expect(url.origin + url.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe(ENV.GOOGLE_CALLBACK_URL);
    expect(url.searchParams.get('response_type')).toBe('code');
    // State phải giải mã lại được nguyên vẹn ở bước callback.
    await expect(
      service.verifyState(url.searchParams.get('state') ?? undefined),
    ).resolves.toEqual({ locale: 'en', next: '/en/yeu-thich' });
  });

  /** State ký bằng secret khác = request không xuất phát từ nút của mình. */
  it('từ chối state ký bằng secret khác', async () => {
    const foreign = await makeService({
      ...ENV,
      JWT_ACCESS_SECRET: 'secret-khac',
    }).buildAuthorizationUrl({ locale: 'vi' });
    const state = new URL(foreign).searchParams.get('state') ?? '';

    await expect(makeService().verifyState(state)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(makeService().tryVerifyState(state)).resolves.toBeNull();
  });

  it('trả token ở fragment chứ không phải query', () => {
    const service = makeService();

    const url = new URL(
      service.buildSuccessRedirect(
        { locale: 'vi', next: '/vi/thiep-cua-toi' },
        { accessToken: 'access-1', refreshToken: 'refresh-1' },
      ),
    );

    expect(url.pathname).toBe('/vi/oauth/google');
    expect(url.search).toBe('');
    const fragment = new URLSearchParams(url.hash.slice(1));
    expect(fragment.get('access_token')).toBe('access-1');
    expect(fragment.get('refresh_token')).toBe('refresh-1');
    expect(fragment.get('next')).toBe('/vi/thiep-cua-toi');
  });

  it('đưa lỗi về trang đăng nhập đúng locale', () => {
    expect(
      makeService().buildFailureRedirect({ locale: 'en' }, 'cancelled'),
    ).toBe(
      'http://localhost:3000/en/dang-nhap?error=cancelled&provider=google',
    );
  });
});
