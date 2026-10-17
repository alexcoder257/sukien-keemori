import { isRateLimitEnabled } from '@configuration/rate-limit.config';
import { AdminAlertsService } from '@modules/admin-alerts/admin-alerts.service';
import { AuditService } from '@modules/audit/audit.service';
import { CardsService } from '@modules/cards/cards.service';
import { ERROR_MESSAGES } from '@constant/error-messages';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { CaptchaService } from '@modules/captcha/captcha.service';
import { MailService } from '@modules/mail/mail.service';
import { LegalService } from '@modules/legal/legal.service';
import { UserService } from '@modules/user/user.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { User } from '@modules/user/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PasswordResetTokenRepository } from './password-reset-token.repository';
import { GoogleOAuthService } from './google-oauth.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import type {
  OAuthCallbackParams,
  OAuthProfile,
  OAuthProviderService,
  OAuthState,
} from './oauth-provider.service';
import { OAuthAuthorizeDto } from './dto/oauth-authorize.dto';
import type { OAuthProvider } from '@common/enums/oauth-provider.enum';
import type { UserRole } from '@common/enums/user-role.enum';
import { LEGAL_DOCUMENT_VERSIONS } from '@constant/legal-documents';
import { REQUIRED_SIGNUP_DOCUMENTS } from '@common/enums/legal-document.enum';
import { AuthTokens, JwtPayload } from './auth.types';

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_EXPIRES_MINUTES = 30;
const DEFAULT_LOCALE = 'vi';
// Chặn spam theo email: tối thiểu 60s giữa 2 link, tối đa 3 link mỗi giờ.
const RESET_EMAIL_COOLDOWN_MS = 60 * 1000;
const RESET_EMAIL_MAX_PER_HOUR = 3;

/**
 * Mã lỗi gắn vào `?error=` khi luồng OAuth hỏng. Chỉ hai lý do đáng nói riêng
 * với người dùng — email chưa xác minh (Google) và tài khoản không có email
 * (Facebook) — vì cả hai đều cần họ làm gì đó khác; còn lại gộp về `failed`.
 */
function oauthFailureReason(error: unknown): string {
  if (!(error instanceof UnauthorizedException)) return 'failed';
  if (error.message === ERROR_MESSAGES.AUTH.OAUTH_EMAIL_UNVERIFIED) {
    return 'email_unverified';
  }
  if (error.message === ERROR_MESSAGES.AUTH.OAUTH_EMAIL_MISSING) {
    return 'email_missing';
  }
  return 'failed';
}

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  emailNotifications: boolean;
  allowShowcase: boolean;
  /** Đã nối tài khoản Google — trang tài khoản dùng để hiện cách đăng nhập. */
  googleLinked: boolean;
  /** Như trên, cho Facebook. Một người có thể nối cả hai. */
  facebookLinked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly captchaService: CaptchaService,
    private readonly legalService: LegalService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly cardsService: CardsService,
    private readonly auditService: AuditService,
    private readonly adminAlertsService: AdminAlertsService,
  ) {}

  /** Nhà cung cấp OAuth theo khoá route. */
  private oauth(provider: OAuthProvider): OAuthProviderService {
    return provider === 'google'
      ? this.googleOAuthService
      : this.facebookOAuthService;
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    // Kể cả tài khoản đã bị admin vô hiệu hoá: hàng vẫn giữ chỗ ở unique index
    // của email, nên địa chỉ đó không đăng ký lại được. Trả đúng câu "email đã
    // được đăng ký" thay vì tiết lộ tài khoản đó đã bị xoá.
    const existing = await this.userService.findByEmailIncludingDeleted(
      dto.email,
    );
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_EXISTS);
    }

    // Chốt chặn chấp thuận chạy **trước** khi tài khoản tồn tại: phát hiện
    // thiếu sau khi đã tạo thì lần thử lại sẽ vấp "email đã được đăng ký".
    this.legalService.assertSignupDocuments(dto.acceptedDocuments);

    // dto.password đã là SHA-256 hash từ client → bcrypt lần nữa để lưu DB.
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userService.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      phone: dto.phone?.trim() || undefined,
    });

    await this.legalService.record(user.id, dto.acceptedDocuments, 'register');
    this.adminAlertsService.newUser({
      email: user.email,
      fullName: user.fullName,
      phone: dto.phone?.trim() || null,
      source: 'register',
    });

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userService.findByEmailWithSecret(dto.email);
    // Không có `passwordHash` = tài khoản tạo qua Google và chưa từng đặt mật
    // khẩu. Trả đúng thông báo như sai mật khẩu để không lộ email nào đã đăng
    // ký; muốn đăng nhập bằng mật khẩu thì đi qua luồng "quên mật khẩu".
    if (!user?.passwordHash) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    return this.buildAuthResult(user);
  }

  /** Bước 1: đưa người dùng sang màn hình chọn tài khoản của nhà cung cấp. */
  getOAuthAuthorizationUrl(
    provider: OAuthProvider,
    dto: OAuthAuthorizeDto,
  ): Promise<string> {
    const oauth = this.oauth(provider);
    const state: OAuthState = {
      locale: dto.locale ?? DEFAULT_LOCALE,
      next: dto.next,
    };
    // Chưa cấu hình client id/secret: đây là điều hướng trình duyệt, ném 503 ở
    // đây thì người dùng nhìn thấy một trang JSON. Đưa họ về trang đăng nhập.
    if (!oauth.isConfigured()) {
      return Promise.resolve(
        oauth.buildFailureRedirect(state, 'not_configured'),
      );
    }
    return oauth.buildAuthorizationUrl(state);
  }

  /**
   * Bước 2: nhà cung cấp gọi lại kèm `code`. Trả về URL để redirect trình
   * duyệt — mọi nhánh hỏng đều quay lại trang đăng nhập kèm mã lỗi, vì đây là
   * điều hướng trình duyệt chứ không phải lời gọi API: ném 401 ở đây thì người
   * dùng chỉ thấy một trang JSON trắng.
   */
  async handleOAuthCallback(
    provider: OAuthProvider,
    params: OAuthCallbackParams,
  ): Promise<string> {
    const oauth = this.oauth(provider);
    const verified = await oauth.tryVerifyState(params.state);
    // State hỏng thì cũng mất luôn locale — rơi về mặc định.
    const state: OAuthState = verified ?? { locale: DEFAULT_LOCALE };
    if (!verified) {
      return oauth.buildFailureRedirect(state, 'state');
    }
    // Người dùng bấm "Huỷ" ở màn hình nhà cung cấp.
    if (params.error || !params.code) {
      return oauth.buildFailureRedirect(state, 'cancelled');
    }

    try {
      const profile = await oauth.fetchProfile(params.code);
      const result = await this.loginWithOAuth(provider, profile);
      return oauth.buildSuccessRedirect(state, result);
    } catch (error) {
      this.logger.error(
        `Đăng nhập ${provider} thất bại: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return oauth.buildFailureRedirect(state, oauthFailureReason(error));
    }
  }

  /**
   * Đăng nhập/đăng ký bằng hồ sơ OAuth đã xác thực.
   *
   * Ba nhánh: đã nối khoá của nhà cung cấp thì dùng luôn; trùng email thì nối
   * vào tài khoản sẵn có (chỉ khi nhà cung cấp đã xác minh email — nếu không,
   * đăng ký một email bất kỳ bên đó là chiếm được tài khoản người khác); còn
   * lại thì tạo tài khoản mới không có mật khẩu.
   *
   * Nhánh giữa cũng chính là chỗ một người đã đăng nhập bằng Google rồi bấm
   * Facebook (hoặc ngược lại) không bị tạo tài khoản thứ hai: cùng email thì
   * hai khoá cùng nằm trên một hàng.
   */
  async loginWithOAuth(
    provider: OAuthProvider,
    profile: OAuthProfile,
  ): Promise<AuthResult> {
    // Tra cả tài khoản đã bị vô hiệu hoá ở hai nhánh đầu. Bỏ qua chúng thì
    // luồng rơi xuống nhánh "tạo tài khoản mới" và vỡ ở unique index của email
    // — người bị khoá nhận lỗi 500 thay vì câu trả lời đúng.
    const linked = await this.userService.findByOAuthIdIncludingDeleted(
      provider,
      profile.providerId,
    );
    if (linked) {
      this.assertNotDisabled(linked);
      return this.buildAuthResult(linked);
    }

    if (!profile.emailVerified) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.OAUTH_EMAIL_UNVERIFIED,
      );
    }

    const existing = await this.userService.findByEmailIncludingDeleted(
      profile.email,
    );
    if (existing) {
      this.assertNotDisabled(existing);
      const user = await this.userService.linkOAuthAccount(
        existing.id,
        provider,
        profile.providerId,
        profile.avatarUrl,
      );
      return this.buildAuthResult(user);
    }

    const created = await this.userService.create({
      email: profile.email,
      fullName: profile.fullName,
      [provider === 'google' ? 'googleId' : 'facebookId']: profile.providerId,
      avatarUrl: profile.avatarUrl,
    });

    // Đăng nhập ngoài không có ô tick nào để gửi lên, nên chấp thuận ở đây là
    // **chấp thuận bằng hành vi**: màn đăng ký ghi rõ ngay dưới hai nút rằng
    // bấm tiếp tục nghĩa là đồng ý. Ghi với `source: 'oauth'` chứ không phải
    // `'register'` chính là để sau này phân biệt được hai mức bằng chứng đó.
    // Phiên bản lấy từ hằng số backend vì không có client nào khai — xem
    // `constant/legal-documents.ts`.
    await this.legalService.record(
      created.id,
      REQUIRED_SIGNUP_DOCUMENTS.map((type) => ({
        type,
        version: LEGAL_DOCUMENT_VERSIONS[type],
      })),
      'oauth',
    );
    this.adminAlertsService.newUser({
      email: created.email,
      fullName: created.fullName,
      source: provider,
    });

    return this.buildAuthResult(created);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    const user = await this.userService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    // Rotate: cấp cặp token mới, lưu hash mới (token cũ thành vô hiệu).
    return this.buildAuthResult(user);
  }

  async logout(userId: string): Promise<void> {
    await this.userService.setRefreshTokenHash(userId, null);
  }

  /**
   * Gửi email chứa link đặt lại mật khẩu.
   * Luôn trả về cùng một kết quả dù email có tồn tại hay không — tránh để
   * kẻ tấn công dò xem email nào đã đăng ký (user enumeration).
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    // Chặn bot spam email trước khi chạm tới DB hay quota gửi mail — bỏ qua
    // ở lần "gửi lại" vì cooldown/trần theo email + throttle IP đã đủ chặn.
    if (!dto.isResend) {
      await this.captchaService.verify(dto.captchaToken);
    }

    const user = await this.userService.findByEmail(dto.email);
    if (!user) return;

    // Vượt hạn mức thì im lặng không gửi (vẫn trả 204 như mọi trường hợp
    // khác) — báo lỗi ở đây sẽ để lộ email nào đã đăng ký.
    if (!(await this.canSendResetEmail(user.id))) return;

    // Mỗi lần yêu cầu chỉ có duy nhất một link còn hiệu lực.
    await this.passwordResetTokenRepository.invalidateAllForUser(user.id);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
    );
    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        userId: user.id,
        tokenHash: this.hashResetToken(token),
        expiresAt,
        usedAt: null,
      }),
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const locale = dto.locale ?? DEFAULT_LOCALE;
    const resetUrl = `${frontendUrl}/${locale}/dat-lai-mat-khau?token=${token}`;

    await this.mailService.sendResetPasswordEmail(
      user.email,
      user.fullName,
      resetUrl,
      RESET_TOKEN_EXPIRES_MINUTES,
    );
  }

  /** Đặt mật khẩu mới bằng token trong email; token chỉ dùng được một lần. */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const record = await this.passwordResetTokenRepository.findByTokenHash(
      this.hashResetToken(dto.token),
    );
    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_RESET_TOKEN);
    }

    // dto.password đã là SHA-256 hash từ client → bcrypt lần nữa để lưu DB.
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.userService.setPasswordHash(record.userId, passwordHash);
    await this.passwordResetTokenRepository.markUsed(record.id);
  }

  /**
   * Đổi mật khẩu khi đang đăng nhập.
   *
   * Khác `resetPassword` ở chỗ bằng chứng sở hữu là **mật khẩu hiện tại** chứ
   * không phải token gửi qua email — nên không cần hộp thư, và đây là đường
   * duy nhất đổi được mật khẩu của tài khoản quản trị khi email chưa cấu hình.
   *
   * `setPasswordHash` thu hồi luôn refresh token, tức đổi mật khẩu là đăng xuất
   * khỏi mọi thiết bị khác. Đó là hành vi mong muốn: lý do phổ biến nhất để đổi
   * mật khẩu là nghi ngờ có người khác đang dùng tài khoản.
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userService.findByIdWithSecret(userId);
    if (!user) throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);

    // Tài khoản tạo qua Google/Facebook có `password_hash = NULL` — không có gì
    // để đối chiếu. Phải kiểm trước khi gọi bcrypt: `bcrypt.compare` với hash
    // `null` ném lỗi kiểu, và người dùng sẽ thấy 500 thay vì lời giải thích.
    if (!user.passwordHash) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.NO_PASSWORD_SET);
    }

    const matches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.WRONG_CURRENT_PASSWORD,
      );
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.SAME_PASSWORD);
    }

    // `dto.newPassword` đã là SHA-256 từ client → bcrypt lần nữa để lưu, đúng
    // đường đi của `register` và `resetPassword`.
    await this.userService.setPasswordHash(
      userId,
      await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
    );
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userService.findByIdOrFail(userId);
    return this.toPublicUser(user);
  }

  /** Người dùng chỉ tự sửa được hồ sơ hiển thị; email/role đi đường khác. */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    const user = await this.userService.updateProfile(userId, {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
      // Chuỗi rỗng = xoá số điện thoại.
      ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
      ...(dto.emailNotifications !== undefined
        ? { emailNotifications: dto.emailNotifications }
        : {}),
      ...(dto.allowShowcase !== undefined
        ? { allowShowcase: dto.allowShowcase }
        : {}),
    });
    return this.toPublicUser(user);
  }

  /**
   * Tự xoá tài khoản — **xoá thật**. Mọi dữ liệu liên quan (thiệp, lời chúc,
   * tim, cửa hàng đối tác, đơn hàng) đi theo FK `ON DELETE CASCADE`. Chặn tài
   * khoản quản trị: quyền vận hành không được tự biến mất bằng một cú bấm phía
   * khách.
   *
   * **Thứ tự ba bước dưới đây là bắt buộc**, và lý do của từng bước:
   *
   * 1. Chụp lại hồ sơ và dọn ảnh **trước khi xoá**. `wedding_cards` bị cascade
   *    xoá ngay trong database, không đi qua `CardsService.remove`, nên sau
   *    bước 2 thì không còn cách nào biết những `card.id` cần dọn nữa — ảnh sẽ
   *    nằm lại kho vĩnh viễn. Đây chính là lỗ thủng mà hàm này vá.
   * 2. Xoá tài khoản. Từ đây trở đi thao tác không hoàn tác được.
   * 3. Ghi nhật ký **sau khi xoá xong**, bằng ảnh chụp lấy ở bước 1. Ghi trước
   *    thì một lần xoá thất bại vẫn để lại dòng "đã xoá tài khoản" — một bản
   *    ghi sai còn tệ hơn không có bản ghi. Email phải chụp từ trước vì tới lúc
   *    này hàng `users` không còn để tra.
   *
   * Bước dọn ảnh và bước ghi nhật ký đều **không ném lỗi** ra ngoài: tới lúc đó
   * người dùng đã bấm nút và thứ họ chờ là tài khoản biến mất. Một lỗi nổi lên
   * ở đây trả về 500 trong khi tài khoản đã xoá xong, và lần thử lại sẽ báo
   * "không tìm thấy" — không giải thích được với ai.
   */
  async deleteAccount(userId: string, ipAddress?: string): Promise<void> {
    const user = await this.userService.findByIdOrFail(userId);

    // Chụp trước khi hàng biến mất; dòng nhật ký ở cuối hàm đọc từ đây.
    const snapshot = { userId, email: user.email, role: user.role };
    const cleanedCardIds =
      await this.cardsService.removeStorageForOwner(userId);

    await this.userService.deleteAccount(userId);

    await this.auditService.record({
      action: 'user.self_deleted',
      actor: snapshot,
      targetType: 'user',
      targetId: userId,
      targetLabel: user.email,
      metadata: { cleanedCards: cleanedCardIds.length },
      ipAddress,
    });
  }

  // ===== helpers =====

  /**
   * Chặn tài khoản đã bị admin vô hiệu hoá.
   *
   * Chỉ cần gọi ở những chỗ cố tình tra `withDeleted`; các đường còn lại
   * (login bằng mật khẩu, refresh token, guard) đi qua repository mặc định nên
   * đã không thấy hàng đã xoá.
   */
  private assertNotDisabled(user: User): void {
    if (user.deletedAt) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCOUNT_DISABLED);
    }
  }

  /**
   * Hạn mức gửi link đặt lại mật khẩu theo từng tài khoản.
   * Bổ sung cho rate limit theo IP: kẻ tấn công đổi IP liên tục vẫn không dội
   * được mail vào hộp thư của một người.
   */
  private async canSendResetEmail(userId: string): Promise<boolean> {
    if (!isRateLimitEnabled(this.configService)) return true;

    const latest =
      await this.passwordResetTokenRepository.findLatestForUser(userId);
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < RESET_EMAIL_COOLDOWN_MS
    ) {
      this.logger.warn(`Bỏ qua yêu cầu đặt lại mật khẩu: chưa hết cooldown`);
      return false;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sentLastHour =
      await this.passwordResetTokenRepository.countCreatedSince(
        userId,
        oneHourAgo,
      );
    if (sentLastHour >= RESET_EMAIL_MAX_PER_HOUR) {
      this.logger.warn(`Bỏ qua yêu cầu đặt lại mật khẩu: vượt hạn mức mỗi giờ`);
      return false;
    }

    return true;
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const tokens = await this.issueTokens(user);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);
    await this.userService.setRefreshTokenHash(user.id, refreshHash);
    return { user: this.toPublicUser(user), ...tokens };
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRES',
      ) as JwtSignOptions['expiresIn'],
    };
    const refreshOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES',
      ) as JwtSignOptions['expiresIn'],
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessOptions),
      this.jwtService.signAsync(payload, refreshOptions),
    ]);
    return { accessToken, refreshToken };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      emailNotifications: user.emailNotifications,
      allowShowcase: user.allowShowcase,
      googleLinked: user.googleId !== null,
      facebookLinked: user.facebookId !== null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
