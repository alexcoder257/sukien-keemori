import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminUserEntity } from './admin-user.entity';
import { AdminUserRepository } from './admin-user.repository';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

/**
 * Tài khoản và đăng nhập của người vận hành CMS (bảng `admin_users`).
 *
 * Import **một lần** ở `AppModule`. Controller quản trị ở các domain khác dùng
 * thẳng `AdminJwtAuthGuard` + `PermissionsGuard` — guard đầu chỉ tham chiếu
 * strategy theo tên đã đăng ký với Passport, guard sau chỉ cần `Reflector` —
 * nên các domain không phải import module này và không sinh phụ thuộc vòng.
 */
@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([AdminUserEntity]),
    // Secret truyền lúc sign/verify (`adminJwtSecret`), đăng ký rỗng là đủ.
    JwtModule.register({}),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminUserRepository, AdminJwtStrategy],
})
export class AdminAuthModule {}
