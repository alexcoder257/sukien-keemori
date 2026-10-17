import type { AdminPermission } from '@common/enums/admin-permission.enum';
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'admin-permissions';

/**
 * Quyền cần có để gọi route. Khai ở class hoặc method; method **thắng** class
 * (`getAllAndOverride`), giống `@Roles` trước đây.
 *
 * Khai nhiều quyền nghĩa là **cần đủ cả**, không phải một trong số đó: route
 * quản trị nào cũng nên nói rõ nó cần gì, và "một trong số" là cách một quyền
 * nhỏ vô tình mở ra màn của quyền lớn.
 *
 * Luôn đi kèm `@UseGuards(AdminJwtAuthGuard, PermissionsGuard)`.
 */
export const Permissions = (...permissions: AdminPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
