import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminPermission } from '@common/enums/admin-permission.enum';
import type { AdminUser } from '../admin-auth.types';
import { PermissionsGuard } from './permissions.guard';

function run(
  required: AdminPermission[] | undefined,
  user: AdminUser | undefined,
): boolean {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return new PermissionsGuard(reflector).canActivate(context);
}

function admin(...permissions: AdminPermission[]): AdminUser {
  return {
    userId: 'admin-1',
    email: 'ops@keemori.vn',
    role: 'admin',
    permissions,
  };
}

describe('PermissionsGuard', () => {
  it('cho qua khi có đủ quyền', () => {
    expect(run(['content:manage'], admin('content:manage'))).toBe(true);
  });

  it('chặn khi thiếu quyền', () => {
    expect(() => run(['users:delete'], admin('content:manage'))).toThrow(
      ForbiddenException,
    );
  });

  it('khai nhiều quyền nghĩa là cần đủ cả', () => {
    expect(() =>
      run(['users:view', 'users:delete'], admin('users:view')),
    ).toThrow(ForbiddenException);
  });

  // Quên khai `@Permissions` phải hỏng theo hướng đóng cửa.
  it('chặn route không khai quyền nào', () => {
    expect(() => run(undefined, admin('content:manage'))).toThrow(
      ForbiddenException,
    );
  });

  it('chặn khi không có người dùng', () => {
    expect(() => run(['content:manage'], undefined)).toThrow(
      ForbiddenException,
    );
  });
});
