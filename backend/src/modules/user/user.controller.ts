import type { AdminUser } from '@modules/admin-auth/admin-auth.types';
import { CurrentAdmin } from '@modules/admin-auth/decorators/current-admin.decorator';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserService } from './user.service';

/**
 * Bảng người dùng (khách) trong CMS.
 *
 * Không có route đổi quyền: tài khoản quản trị nằm ở `admin_users` chứ không
 * ở bảng này. Bảng `users` vì vậy không còn giá trị quyền nào để CMS đặt tay.
 */
@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('users:view')
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  @Get()
  search(@Query() query: QueryUsersDto) {
    return this.userService.search(query);
  }

  /**
   * Vô hiệu hoá tài khoản — soft delete, không xoá dữ liệu (xem
   * `User.deletedAt`). Quyền riêng `users:delete`: đây là thao tác quyết định
   * ai còn vào được hệ thống.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('users:delete')
  remove(
    @CurrentAdmin() actor: AdminUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.userService.softDelete(actor, id);
  }
}
