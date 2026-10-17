import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { GoogleAnalyticsService } from './google-analytics.service';
import { RecordVisitDto } from './dto/record-visit.dto';
import { QueryGoogleAnalyticsDto } from './dto/query-google-analytics.dto';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

/**
 * Beacon đếm lượt truy cập, gọi từ trang khách. Công khai vì khách chưa đăng
 * nhập cũng phải đếm được; siết rate limit chặt hơn mặc định để một tab không
 * thổi phồng số liệu bằng cách gọi liên tục.
 */
@Controller('public/visits')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  record(@Body() dto: RecordVisitDto) {
    return this.analyticsService.record(dto.isNewVisitor ?? false);
  }
}

/**
 * Báo cáo Google Analytics cho màn Phân tích của CMS.
 *
 * `super_admin` như `/admin/analytics` — cùng một màn thì cùng một mức quyền,
 * để không có khối nào trong đó hiện ra với người không được xem khối bên cạnh.
 */
@Controller('admin/analytics/google')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('analytics:view')
export class GoogleAnalyticsAdminController {
  constructor(
    private readonly googleAnalyticsService: GoogleAnalyticsService,
  ) {}

  @Get()
  report(@Query() query: QueryGoogleAnalyticsDto) {
    return this.googleAnalyticsService.report(query.days ?? 30);
  }
}
