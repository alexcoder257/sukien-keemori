import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { PasswordResetToken } from './password-reset-token.entity';

@Injectable()
export class PasswordResetTokenRepository extends Repository<PasswordResetToken> {
  constructor(private readonly dataSource: DataSource) {
    super(PasswordResetToken, dataSource.createEntityManager());
  }

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.findOne({ where: { tokenHash } });
  }

  /** Vô hiệu hoá mọi token chưa dùng của user (mỗi lần yêu cầu chỉ 1 link sống). */
  async invalidateAllForUser(userId: string): Promise<void> {
    await this.update({ userId, usedAt: IsNull() }, { usedAt: new Date() });
  }

  findLatestForUser(userId: string): Promise<PasswordResetToken | null> {
    return this.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Đếm số link đã gửi cho user kể từ mốc thời gian — dùng để chặn spam. */
  countCreatedSince(userId: string, since: Date): Promise<number> {
    return this.count({ where: { userId, createdAt: MoreThan(since) } });
  }

  async markUsed(id: string): Promise<void> {
    await this.update(id, { usedAt: new Date() });
  }
}
