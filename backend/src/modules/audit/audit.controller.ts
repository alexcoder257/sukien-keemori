import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AUDIT_ACTIONS } from '@common/enums/audit-action.enum';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

/**
 * Nhật ký thao tác — quyền **`super_admin`**.
 *
 * Không phải `admin`, dù phần lớn dòng trong đây là việc của admin. Nhật ký là
 * thứ để soi lại chính người vận hành; mở cho `admin` thì người bị soi cũng là
 * người đọc được nhật ký về mình, và mục đích đối trace mất phần lớn ý nghĩa.
 *
 * Chỉ có đúng một route và nó chỉ đọc. Không có route sửa, không có route xoá,
 * kể cả cho `super_admin` — một cuốn sổ mà người dùng nó xoá được dòng thì
 * không còn là bằng chứng. Dọn theo thời hạn lưu trữ là việc của cron, và con
 * số đó còn đang chờ chốt ở `docs/legal-decisions.md` mục 4.
 */
@Controller('admin/audit-logs')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('audit:view')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(@Query() query: QueryAuditLogsDto) {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const [items, total] = await this.auditService.findPage({
      action: query.action,
      actorId: query.actorId,
      targetId: query.targetId,
      limit,
      offset,
    });
    return { items, total, limit, offset };
  }

  /** Danh sách hành động để CMS dựng ô lọc mà không phải chép lại enum. */
  @Get('actions')
  actions() {
    return AUDIT_ACTIONS;
  }
}
