import { AdminAlertsModule } from '@modules/admin-alerts/admin-alerts.module';
import { AuditModule } from '@modules/audit/audit.module';
import { CardsModule } from '@modules/cards/cards.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptchaModule } from '@modules/captcha/captcha.module';
import { LegalModule } from '@modules/legal/legal.module';
import { MailModule } from '@modules/mail/mail.module';
import { UserModule } from '@modules/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './google-oauth.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import { PasswordResetToken } from './password-reset-token.entity';
import { PasswordResetTokenRepository } from './password-reset-token.repository';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';

@Module({
  imports: [
    UserModule,
    // Chỉ để dọn ảnh khi tài khoản bị xoá thật: cascade của Postgres xoá hàng
    // `wedding_cards` mà không đi qua `CardsService`, nên không có đường nào
    // khác biết những thư mục ảnh cần dọn. `CardsModule` không import ngược
    // `AuthModule` nên nhánh này không tạo vòng.
    CardsModule,
    AuditModule,
    AdminAlertsModule,
    MailModule,
    CaptchaModule,
    LegalModule,
    PassportModule,
    TypeOrmModule.forFeature([PasswordResetToken]),
    // Secret/expiry của từng token được truyền trực tiếp lúc sign/verify
    // trong AuthService, nên đăng ký JwtModule rỗng là đủ.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleOAuthService,
    FacebookOAuthService,
    JwtAccessStrategy,
    PasswordResetTokenRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
