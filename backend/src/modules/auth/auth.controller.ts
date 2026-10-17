import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { OAuthAuthorizeDto } from './dto/oauth-authorize.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './auth.types';

@Controller('auth') // mọi route bắt đầu bằng /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') // POST /auth/register
  @Throttle({ default: { limit: 5, ttl: 60 * 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login') // POST /auth/login
  // Chặn dò mật khẩu: 10 lần đăng nhập / 5 phút cho mỗi IP.
  @Throttle({ default: { limit: 10, ttl: 5 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /auth/google — điểm vào OAuth, redirect sang màn hình Google.
  // Là điều hướng trình duyệt nên phải là GET và không có body.
  @Get('google')
  @Throttle({ default: { limit: 20, ttl: 15 * 60_000 } })
  @Redirect()
  async googleAuthorize(@Query() dto: OAuthAuthorizeDto) {
    return {
      url: await this.authService.getOAuthAuthorizationUrl('google', dto),
    };
  }

  /**
   * GET /auth/google/callback — redirect URI khai trong Google Cloud Console.
   *
   * Lấy từng tham số một chứ không dùng DTO: ValidationPipe toàn cục bật
   * `forbidNonWhitelisted`, mà Google còn gắn thêm `scope`, `authuser`,
   * `prompt`, `hd`… vào query. Một DTO ở đây sẽ khiến mọi callback thật trả
   * 400. `@UsePipes` cũng không cứu được vì pipe route chạy **thêm** vào pipe
   * toàn cục chứ không thay thế nó.
   */
  @Get('google/callback')
  @Redirect()
  async googleCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    return {
      url: await this.authService.handleOAuthCallback('google', {
        code,
        state,
        error,
      }),
    };
  }

  // GET /auth/facebook — song sinh của route Google ở trên.
  @Get('facebook')
  @Throttle({ default: { limit: 20, ttl: 15 * 60_000 } })
  @Redirect()
  async facebookAuthorize(@Query() dto: OAuthAuthorizeDto) {
    return {
      url: await this.authService.getOAuthAuthorizationUrl('facebook', dto),
    };
  }

  /**
   * GET /auth/facebook/callback — "Valid OAuth Redirect URI" khai trong
   * Facebook App Dashboard. Không dùng DTO, vì lý do đã nói ở nhánh Google:
   * Facebook gắn thêm `error_reason`, `error_description`, `#_=_`… vào query.
   */
  @Get('facebook/callback')
  @Redirect()
  async facebookCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    return {
      url: await this.authService.handleOAuthCallback('facebook', {
        code,
        state,
        error,
      }),
    };
  }

  @Post('refresh') // POST /auth/refresh
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('forgot-password') // POST /auth/forgot-password
  // 10 request / 15 phút cho mỗi IP. Để rộng vì nhiều người dùng có thể dùng
  // chung một IP (mạng công ty, NAT của nhà mạng di động).
  // Hạn mức theo từng email nằm trong service.
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password') // POST /auth/reset-password
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout') // POST /auth/logout
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.userId);
  }

  @Get('me') // GET /auth/me
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }

  @Patch('me') // PATCH /auth/me
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  /**
   * Đổi mật khẩu khi đang đăng nhập.
   *
   * Tách khỏi `PATCH /auth/me` (hồ sơ hiển thị) vì nó cần bằng chứng sở hữu
   * riêng — mật khẩu hiện tại — và vì đổi mật khẩu thu hồi mọi phiên khác,
   * chuyện mà một lần đổi tên hiển thị không được phép làm.
   */
  @Patch('me/password') // PATCH /auth/me/password
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  @Delete('me') // DELETE /auth/me
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  deleteMe(@CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return this.authService.deleteAccount(user.userId, ip);
  }
}
