import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import type { AdminUser } from './admin-auth.types';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshTokenDto } from './dto/admin-refresh-token.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

/**
 * Đăng nhập CMS. Chỉ dashboard gọi các route này, và gọi từ **server** (route
 * handler `app/api/auth/*`): refresh token sống trong cookie `httpOnly` của
 * dashboard, JavaScript trình duyệt không cầm được nó.
 *
 * Không dùng `PermissionsGuard`: mọi tài khoản quản trị đều được đăng nhập,
 * xem và đổi mật khẩu của chính mình, bất kể vai trò.
 */
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  // Chặt hơn đăng nhập khách (10 / 5 phút): đây là cửa vào dữ liệu vận hành.
  @Throttle({ default: { limit: 5, ttl: 5 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: AdminRefreshTokenDto) {
    return this.adminAuthService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentAdmin() admin: AdminUser) {
    return this.adminAuthService.logout(admin.userId);
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  me(@CurrentAdmin() admin: AdminUser) {
    return this.adminAuthService.getProfile(admin.userId);
  }

  @Patch('password')
  @UseGuards(AdminJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentAdmin() admin: AdminUser,
    @Body() dto: AdminChangePasswordDto,
  ) {
    return this.adminAuthService.changePassword(admin.userId, dto);
  }
}
