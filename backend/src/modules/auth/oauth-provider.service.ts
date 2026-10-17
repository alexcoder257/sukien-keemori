import { ERROR_MESSAGES } from '@constant/error-messages';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// State chỉ sống đủ để người dùng bấm chọn tài khoản bên nhà cung cấp.
const STATE_EXPIRES = '10m';

/** Dữ liệu đã ký trong `state` — quay về nguyên vẹn ở bước callback. */
export interface OAuthState {
  locale: string;
  next?: string;
}

/**
 * Query nhà cung cấp gắn vào redirect URI. Không phải DTO vì không đi qua
 * ValidationPipe — xem chú thích ở `AuthController.googleCallback`. Cả ba
 * trường đều optional: bấm "Huỷ" ở màn hình đăng nhập thì chỉ có `error`.
 */
export interface OAuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
}

/** Hồ sơ đã đổi từ authorization code, lọc còn những trường ta dùng. */
export interface OAuthProfile {
  /** Định danh không đổi bên nhà cung cấp (`sub` của Google, `id` của FB). */
  providerId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl?: string;
}

/**
 * Phần dùng chung của mọi luồng OAuth 2.0 authorization code: ký/kiểm `state`
 * và dựng URL quay về frontend. Mỗi nhà cung cấp chỉ còn phải khai endpoint,
 * scope và cách đọc hồ sơ.
 *
 * Không dùng session để giữ `state`: state là một JWT ngắn hạn ký bằng
 * `JWT_ACCESS_SECRET`, nên backend vẫn stateless mà callback vẫn chứng minh
 * được request xuất phát từ chính nút bấm của mình (chống CSRF), đồng thời
 * mang theo locale và trang đích.
 */
@Injectable()
export abstract class OAuthProviderService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly configService: ConfigService,
    protected readonly jwtService: JwtService,
  ) {}

  /**
   * Khoá nhà cung cấp — vừa là đoạn đường dẫn của trang trung chuyển bên
   * frontend (`/{locale}/oauth/{provider}`), vừa là giá trị `?provider=` gắn
   * kèm khi luồng hỏng để trang đăng nhập gọi đúng tên nhà cung cấp.
   */
  abstract get provider(): string;

  /** Bật/tắt theo cấu hình — thiếu client id/secret thì coi như chưa mở. */
  abstract isConfigured(): boolean;

  /** Bước 1: URL màn hình đăng nhập/chọn tài khoản của nhà cung cấp. */
  abstract buildAuthorizationUrl(state: OAuthState): Promise<string>;

  /** Bước 2: đổi authorization code lấy hồ sơ người dùng. */
  abstract fetchProfile(code: string): Promise<OAuthProfile>;

  async verifyState(state: string | undefined): Promise<OAuthState> {
    if (!state) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.OAUTH_INVALID_STATE);
    }
    try {
      const payload = await this.jwtService.verifyAsync<OAuthState>(state, {
        secret: this.stateSecret,
      });
      return { locale: payload.locale, next: payload.next };
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.OAUTH_INVALID_STATE);
    }
  }

  /** Như `verifyState` nhưng trả `null` thay vì ném — dùng ở nhánh callback. */
  async tryVerifyState(state: string | undefined): Promise<OAuthState | null> {
    try {
      return await this.verifyState(state);
    } catch {
      return null;
    }
  }

  /**
   * Trang trung chuyển ở frontend, token nằm ở **fragment** chứ không phải
   * query: fragment không được gửi lên server nên không lọt vào access log của
   * Next.js hay header `Referer` khi trang đó nạp tài nguyên bên thứ ba.
   */
  buildSuccessRedirect(
    state: OAuthState,
    tokens: { accessToken: string; refreshToken: string },
  ): string {
    const fragment = new URLSearchParams({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      ...(state.next ? { next: state.next } : {}),
    });
    return `${this.frontendUrl}/${state.locale}/oauth/${this.provider}#${fragment.toString()}`;
  }

  /** Quay lại trang đăng nhập kèm mã lỗi để frontend hiện thông báo. */
  buildFailureRedirect(state: OAuthState, reason: string): string {
    const query = new URLSearchParams({
      error: reason,
      provider: this.provider,
    });
    return `${this.frontendUrl}/${state.locale}/dang-nhap?${query.toString()}`;
  }

  // ===== helpers dùng chung =====

  protected signState(state: OAuthState): Promise<string> {
    return this.jwtService.signAsync(
      { locale: state.locale, ...(state.next ? { next: state.next } : {}) },
      { secret: this.stateSecret, expiresIn: STATE_EXPIRES },
    );
  }

  protected assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        ERROR_MESSAGES.AUTH.OAUTH_NOT_CONFIGURED,
      );
    }
  }

  protected get frontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
    );
  }

  protected get stateSecret(): string {
    return this.configService.get<string>('JWT_ACCESS_SECRET') ?? '';
  }
}
