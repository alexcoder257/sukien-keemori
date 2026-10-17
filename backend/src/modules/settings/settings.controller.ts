import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SettingsService } from './settings.service';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

/**
 * Cấu hình vận hành (thời gian tồn tại thiệp, link mạng xã hội, thiệp demo
 * của hero) — quyền `settings:manage`.
 */
@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('settings:manage')
export class SettingsAdminController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  find() {
    return this.settingsService.find();
  }

  @Patch()
  update(@Body() dto: UpdateSiteSettingsDto) {
    return this.settingsService.update(dto);
  }
}

/**
 * Phần cấu hình mà trang khách được đọc — hiện chỉ có link Messenger.
 *
 * Tách hẳn khỏi controller trên chứ không bỏ guard ở một route: hàng
 * `site_settings` còn chứa hạn mức nghiệp vụ, và một `GET` không guard trả
 * nguyên entity là đường rò rỉ mặc định mỗi khi ai đó thêm cột mới. Ở đây
 * service chọn tay từng trường, nên cột mới mặc định là riêng tư.
 */
@Controller('settings')
export class SettingsPublicController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  findPublic() {
    return this.settingsService.findPublic();
  }
}
