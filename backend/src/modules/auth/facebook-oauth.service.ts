import { createHmac } from 'node:crypto';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  OAuthProfile,
  OAuthProviderService,
  OAuthState,
} from './oauth-provider.service';

// Graph API buộc phải ghim phiên bản; nâng phiên bản là một thay đổi có chủ ý,
// không phải thứ để mặc cho Facebook tự đẩy.
const FACEBOOK_API_VERSION = 'v21.0';
const FACEBOOK_AUTH_URL = `https://www.facebook.com/${FACEBOOK_API_VERSION}/dialog/oauth`;
const FACEBOOK_TOKEN_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/oauth/access_token`;
const FACEBOOK_ME_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me`;
// Chỉ xin đúng thứ cần để tạo tài khoản: định danh, tên, ảnh (public_profile)
// và email.
const FACEBOOK_SCOPE = 'public_profile,email';
const FACEBOOK_FIELDS = 'id,name,email,picture.type(large)';

interface FacebookTokenResponse {
  access_token?: string;
  error?: { message?: string; type?: string; code?: number };
}

interface FacebookMeResponse {
  id?: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string; is_silhouette?: boolean } };
  error?: { message?: string };
}

/**
 * Luồng OAuth 2.0 authorization code với Facebook Login, gọi thẳng bằng
 * `fetch`. Phần state/redirect dùng chung nằm ở `OAuthProviderService`.
 *
 * Hai chỗ khác Google, cả hai đều là đặc thù của Facebook:
 *
 * 1. **Email có thể không có.** Người dùng đăng ký Facebook bằng số điện thoại
 *    thì không có email nào để trả, và ngay cả khi có họ vẫn bỏ tick được ở
 *    màn hình cấp quyền. Ta khoá tài khoản theo email nên không có email là
 *    không đăng nhập được — báo đúng lý do thay vì lỗi chung chung.
 * 2. **`appsecret_proof`.** Mọi lời gọi Graph kèm chữ ký HMAC của access token
 *    bằng app secret, để token bị lộ cũng không dùng được ngoài server này.
 */
@Injectable()
export class FacebookOAuthService extends OAuthProviderService {
  get provider(): string {
    return 'facebook';
  }

  isConfigured(): boolean {
    return Boolean(this.appId && this.appSecret);
  }

  async buildAuthorizationUrl(state: OAuthState): Promise<string> {
    this.assertConfigured();

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      scope: FACEBOOK_SCOPE,
      state: await this.signState(state),
    });
    return `${FACEBOOK_AUTH_URL}?${params.toString()}`;
  }

  /** Đổi authorization code lấy hồ sơ người dùng. */
  async fetchProfile(code: string): Promise<OAuthProfile> {
    this.assertConfigured();

    const accessToken = await this.exchangeCode(code);
    const params = new URLSearchParams({
      fields: FACEBOOK_FIELDS,
      access_token: accessToken,
      appsecret_proof: this.appSecretProof(accessToken),
    });
    const response = await fetch(`${FACEBOOK_ME_URL}?${params.toString()}`);
    const info = (await response.json()) as FacebookMeResponse;

    if (!response.ok || !info.id) {
      this.logger.error(
        `Facebook /me thất bại: ${info.error?.message ?? response.status}`,
      );
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.OAUTH_FAILED);
    }

    if (!info.email) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.OAUTH_EMAIL_MISSING);
    }

    return {
      providerId: info.id,
      email: info.email.toLowerCase(),
      // Facebook chỉ trả về email nó đã xác minh, không có cờ riêng như Google.
      emailVerified: true,
      fullName: info.name?.trim() || info.email.split('@')[0],
      // Ảnh mặc định (bóng người) không đáng lưu — để trống cho UI dựng chữ cái
      // đầu như tài khoản thường.
      avatarUrl: info.picture?.data?.is_silhouette
        ? undefined
        : info.picture?.data?.url,
    };
  }

  // ===== helpers =====

  private async exchangeCode(code: string): Promise<string> {
    const params = new URLSearchParams({
      code,
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.callbackUrl,
    });
    // Facebook nhận bước này bằng GET; POST cũng chạy nhưng GET là dạng tài
    // liệu chính thức mô tả.
    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);

    const body = (await response.json()) as FacebookTokenResponse;
    if (!response.ok || !body.access_token) {
      // Không log code/secret; chỉ thông điệp lỗi Facebook trả về.
      this.logger.error(
        `Đổi code Facebook thất bại: ${body.error?.message ?? response.status}`,
      );
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.OAUTH_FAILED);
    }
    return body.access_token;
  }

  private appSecretProof(accessToken: string): string {
    return createHmac('sha256', this.appSecret)
      .update(accessToken)
      .digest('hex');
  }

  private get appId(): string {
    return this.configService.get<string>('FACEBOOK_APP_ID') ?? '';
  }

  private get appSecret(): string {
    return this.configService.get<string>('FACEBOOK_APP_SECRET') ?? '';
  }

  private get callbackUrl(): string {
    return (
      this.configService.get<string>('FACEBOOK_CALLBACK_URL') ??
      'http://localhost:3001/auth/facebook/callback'
    );
  }
}
