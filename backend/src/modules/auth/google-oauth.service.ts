import { ERROR_MESSAGES } from '@constant/error-messages';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  OAuthProfile,
  OAuthProviderService,
  OAuthState,
} from './oauth-provider.service';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
// Chỉ xin đúng thứ cần để tạo tài khoản: định danh, email, tên, ảnh.
const GOOGLE_SCOPE = 'openid email profile';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Luồng OAuth 2.0 authorization code với Google, gọi thẳng bằng `fetch`.
 * Phần state/redirect dùng chung nằm ở `OAuthProviderService`.
 */
@Injectable()
export class GoogleOAuthService extends OAuthProviderService {
  get provider(): string {
    return 'google';
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  async buildAuthorizationUrl(state: OAuthState): Promise<string> {
    this.assertConfigured();

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      scope: GOOGLE_SCOPE,
      state: await this.signState(state),
      // Luôn cho chọn tài khoản: nhiều người dùng chung máy có nhiều Google.
      prompt: 'select_account',
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /** Đổi authorization code lấy hồ sơ người dùng. */
  async fetchProfile(code: string): Promise<OAuthProfile> {
    this.assertConfigured();

    const accessToken = await this.exchangeCode(code);
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      this.logger.error(`Google userinfo thất bại: ${response.status}`);
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.OAUTH_FAILED);
    }

    const info = (await response.json()) as GoogleUserInfoResponse;
    if (!info.sub || !info.email) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.OAUTH_FAILED);
    }

    return {
      providerId: info.sub,
      email: info.email.toLowerCase(),
      emailVerified: info.email_verified === true,
      // Google cho phép hồ sơ không có tên — lấy phần trước @ làm tên tạm.
      fullName: info.name?.trim() || info.email.split('@')[0],
      avatarUrl: info.picture,
    };
  }

  // ===== helpers =====

  private async exchangeCode(code: string): Promise<string> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.callbackUrl,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const body = (await response.json()) as GoogleTokenResponse;
    if (!response.ok || !body.access_token) {
      // Không log code/secret; chỉ mã lỗi Google trả về.
      this.logger.error(
        `Đổi code Google thất bại: ${body.error ?? response.status}`,
      );
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.OAUTH_FAILED);
    }
    return body.access_token;
  }

  private get clientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
  }

  private get clientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
  }

  private get callbackUrl(): string {
    return (
      this.configService.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:3001/auth/google/callback'
    );
  }
}
