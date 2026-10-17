import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AdminAuthService } from './admin-auth.service';
import type { AdminUserEntity } from './admin-user.entity';
import type { AdminUserRepository } from './admin-user.repository';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');

const config = {
  get: (key: string) =>
    ({ JWT_ACCESS_SECRET: 'access', JWT_REFRESH_SECRET: 'refresh' })[key],
} as unknown as ConfigService;

async function setup(overrides: Partial<AdminUserEntity> = {}) {
  const admin = {
    id: 'admin-1',
    email: 'admin@gmail.com',
    fullName: 'Admin',
    role: 'super_admin',
    isActive: true,
    lastLoginAt: null,
    passwordHash: await bcrypt.hash(sha('1234@Dcba'), 4),
    refreshTokenHash: null as string | null,
    ...overrides,
  } as AdminUserEntity;

  const repo = {
    findByEmailWithPassword: jest.fn((email: string) =>
      Promise.resolve(email.toLowerCase() === admin.email ? admin : null),
    ),
    findByIdWithPassword: jest.fn(() => Promise.resolve(admin)),
    findByIdWithRefreshToken: jest.fn(() => Promise.resolve(admin)),
    findActiveById: jest.fn(() =>
      Promise.resolve(admin.isActive ? admin : null),
    ),
    setRefreshTokenHash: jest.fn((_id: string, hash: string | null) => {
      admin.refreshTokenHash = hash;
      return Promise.resolve();
    }),
    setPasswordHash: jest.fn((_id: string, hash: string) => {
      admin.passwordHash = hash;
      admin.refreshTokenHash = null;
      return Promise.resolve();
    }),
    markLoggedIn: jest.fn(() => Promise.resolve()),
  };
  const service = new AdminAuthService(
    repo as unknown as AdminUserRepository,
    new JwtService({}),
    config,
  );
  return { service, repo, admin };
}

describe('AdminAuthService', () => {
  it('đăng nhập đúng mật khẩu thì cấp token mang loại cms và quyền của vai trò', async () => {
    const { service } = await setup();
    const tokens = await service.login({
      email: 'admin@gmail.com',
      password: sha('1234@Dcba'),
    });

    const payload = new JwtService({}).decode<Record<string, unknown>>(
      tokens.accessToken,
    );
    expect(payload).toMatchObject({ sub: 'admin-1', typ: 'cms' });
    expect(payload.permissions).toContain('audit:view');
  });

  it('sai mật khẩu hoặc email lạ trả cùng một lỗi', async () => {
    const { service } = await setup();
    await expect(
      service.login({ email: 'admin@gmail.com', password: sha('sai') }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.login({ email: 'khac@gmail.com', password: sha('1234@Dcba') }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('tài khoản bị tắt không đăng nhập được dù đúng mật khẩu', async () => {
    const { service } = await setup({ isActive: false });
    await expect(
      service.login({ email: 'admin@gmail.com', password: sha('1234@Dcba') }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh token cũ hết hiệu lực sau khi xoay vòng', async () => {
    const { service } = await setup();
    const first = await service.login({
      email: 'admin@gmail.com',
      password: sha('1234@Dcba'),
    });
    await service.refresh(first.refreshToken);
    await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh token của khách không dùng được', async () => {
    const { service } = await setup();
    const customerToken = await new JwtService({}).signAsync(
      { sub: 'admin-1', email: 'admin@gmail.com', role: 'customer' },
      { secret: 'refresh' },
    );
    await expect(service.refresh(customerToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('đổi mật khẩu: sai mật khẩu hiện tại là 400, đúng thì thu hồi phiên', async () => {
    const { service, admin } = await setup();
    await expect(
      service.changePassword('admin-1', {
        currentPassword: sha('sai'),
        newPassword: sha('Moi@12345'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    admin.refreshTokenHash = 'x';
    await service.changePassword('admin-1', {
      currentPassword: sha('1234@Dcba'),
      newPassword: sha('Moi@12345'),
    });
    expect(admin.refreshTokenHash).toBeNull();
    await expect(
      service.login({ email: 'admin@gmail.com', password: sha('Moi@12345') }),
    ).resolves.toHaveProperty('accessToken');
  });
});
