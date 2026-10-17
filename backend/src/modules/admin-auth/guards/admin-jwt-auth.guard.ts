import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ADMIN_JWT_STRATEGY } from '../strategies/admin-jwt.strategy';

/**
 * Yêu cầu access token CMS. Token của khách — ký bằng secret khác — **không**
 * qua được guard này, và ngược lại token CMS không qua được `JwtAuthGuard`:
 * hai cửa, hai tập tài khoản.
 */
@Injectable()
export class AdminJwtAuthGuard extends AuthGuard(ADMIN_JWT_STRATEGY) {}
