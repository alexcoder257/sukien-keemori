import { ACTIVE_NOTIFICATION_TYPES } from '@common/enums/notification.enum';
import { Injectable } from '@nestjs/common';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationRepository extends Repository<Notification> {
  constructor(private readonly dataSource: DataSource) {
    super(Notification, dataSource.createEntityManager());
  }

  /**
   * Danh sách trong chuông: mới nhất trước, cắt ngắn ngay ở tầng DB. Chỉ các
   * loại còn hoạt động — hàng cũ của loại đã gỡ nằm im trong bảng.
   */
  findRecent(userId: string, limit: number): Promise<Notification[]> {
    return this.find({
      where: { userId, type: In([...ACTIVE_NOTIFICATION_TYPES]) },
      order: { lastEventAt: 'DESC' },
      take: limit,
    });
  }

  findOneForUser(id: string, userId: string): Promise<Notification | null> {
    return this.findOne({ where: { id, userId } });
  }

  /** Thông báo chưa đọc của cùng một nguồn — chỗ để cộng dồn sự kiện mới. */
  findUnreadByGroup(
    userId: string,
    groupKey: string,
  ): Promise<Notification | null> {
    return this.findOne({ where: { userId, groupKey, readAt: IsNull() } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.update({ userId, readAt: IsNull() }, { readAt: new Date() });
  }

  async markGroupRead(userId: string, groupKey: string): Promise<void> {
    await this.update(
      { userId, groupKey, readAt: IsNull() },
      { readAt: new Date() },
    );
  }
}
