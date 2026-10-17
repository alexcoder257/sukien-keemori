import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AdminUserEntity } from './admin-user.entity';

@Injectable()
export class AdminUserRepository extends Repository<AdminUserEntity> {
  constructor(dataSource: DataSource) {
    super(AdminUserEntity, dataSource.createEntityManager());
  }

  findActiveById(id: string): Promise<AdminUserEntity | null> {
    return this.findOne({ where: { id, isActive: true } });
  }

  /** Kèm `password_hash` — chỉ dùng ở đăng nhập. */
  findByEmailWithPassword(email: string): Promise<AdminUserEntity | null> {
    return this.createQueryBuilder('admin')
      .addSelect('admin.passwordHash')
      .where('LOWER(admin.email) = LOWER(:email)', { email })
      .getOne();
  }

  findByIdWithPassword(id: string): Promise<AdminUserEntity | null> {
    return this.createQueryBuilder('admin')
      .addSelect('admin.passwordHash')
      .where('admin.id = :id', { id })
      .getOne();
  }

  findByIdWithRefreshToken(id: string): Promise<AdminUserEntity | null> {
    return this.createQueryBuilder('admin')
      .addSelect('admin.refreshTokenHash')
      .where('admin.id = :id', { id })
      .getOne();
  }

  async setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.update(id, { refreshTokenHash: hash });
  }

  /** Đổi mật khẩu thu hồi luôn refresh token: phiên ở máy khác phải đăng nhập lại. */
  async setPasswordHash(id: string, hash: string): Promise<void> {
    await this.update(id, { passwordHash: hash, refreshTokenHash: null });
  }

  async markLoggedIn(id: string): Promise<void> {
    await this.update(id, { lastLoginAt: new Date() });
  }
}
