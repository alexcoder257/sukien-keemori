import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { QueryTemplateStatsDto } from './dto/query-template-stats.dto';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

@Controller('admin/dashboard')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('dashboard:view')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  /** Thẻ số liệu đầu trang quản trị. */
  @Get()
  overview() {
    return this.dashboardService.overview();
  }
}

/**
 * Số liệu của một tài khoản, cho màn chi tiết người dùng.
 *
 * Đặt ở module `admin-dashboard` chứ không ở `user`: các con số này thuộc về
 * `cards`, và module này tồn tại đúng để gom số liệu chỉ-đọc từ
 * nhiều domain. Cho `user` tự gọi `cards` sẽ tạo vòng import, và nhân
 * bản query sang đó là mở đường cho hai chỗ đếm lệch nhau.
 */
@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('users:view')
export class UserSummaryAdminController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get(':id/summary')
  summary(@Param('id', ParseUUIDPipe) id: string) {
    return this.dashboardService.userSummary(id);
  }
}

/** Phân tích — quyền `analytics:view`. */
@Controller('admin/analytics')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('analytics:view')
export class AnalyticsAdminController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  analytics(@Query() query: QueryAnalyticsDto) {
    return this.dashboardService.analytics(query.days);
  }
}

/**
 * Mẫu nào trong kho được bấm vào nhiều — quyền `templates:manage`, cùng người
 * quyết mẫu nào lên trang chủ và gắn tag gì. Không đi chung quyền
 * `analytics:view` (chỉ super admin): đây là số liệu để chọn mẫu, không phải
 * báo cáo kinh doanh.
 */
@Controller('admin/template-stats')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('templates:manage')
export class TemplateStatsAdminController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  templateStats(@Query() query: QueryTemplateStatsDto) {
    return this.dashboardService.templateStats(query.days ?? 30);
  }
}
