import { ERROR_MESSAGES } from '@constant/error-messages';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from './notification.entity';
import type { WishPendingPayload } from './notification.entity';
import { NotificationRepository } from './notifications.repository';

/**
 * Số thông báo tối đa trả về cho chuông. Không có endpoint đếm riêng: frontend
 * suy số chưa đọc từ chính danh sách này, đổi lại chỉ tốn một request mỗi lần
 * tải trang. Vì đã gom nhóm theo thiệp nên chạm trần này là rất khó.
 */
const FEED_LIMIT = 30;

/**
 * Dữ liệu để dựng một thông báo "lời chúc chờ duyệt". Nhận kiểu nguyên thuỷ
 * chứ không nhận entity `WeddingCard`: `notifications` cố ý không phụ thuộc
 * module nào, nhờ vậy mọi domain đều bắn được sự kiện vào đây mà không tạo
 * phụ thuộc vòng.
 */
export interface WishPendingEvent {
  ownerId: string;
  cardId: string;
  cardSlug: string;
  cardTitle: string;
  guestName: string;
}

/** Một đơn vừa được ghi nhận đã trả tiền. */
export interface PaymentSuccessEvent {
  userId: string;
  orderId: string;
  cardId: string;
  cardSlug: string;
  cardTitle: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  findRecent(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findRecent(userId, FEED_LIMIT);
  }

  async markRead(userId: string, id: string): Promise<void> {
    const notification = await this.notificationRepository.findOneForUser(
      id,
      userId,
    );
    if (!notification) {
      throw new NotFoundException(ERROR_MESSAGES.NOTIFICATION.NOT_FOUND);
    }
    if (notification.readAt) return;
    notification.readAt = new Date();
    await this.notificationRepository.save(notification);
  }

  markAllRead(userId: string): Promise<void> {
    return this.notificationRepository.markAllRead(userId);
  }

  /**
   * Khách mời vừa gửi lời chúc vào một thiệp. Cộng dồn vào thông báo chưa đọc
   * của chính thiệp đó nếu có — xem `Notification.groupKey`.
   */
  async pushWishPending(event: WishPendingEvent): Promise<void> {
    const groupKey = wishGroupKey(event.cardId);
    const now = new Date();
    const existing = await this.notificationRepository.findUnreadByGroup(
      event.ownerId,
      groupKey,
    );

    if (existing) {
      // Nhóm `wish_pending:<cardId>` chỉ chứa thông báo lời chúc.
      const payload = existing.payload as WishPendingPayload;
      // Gán lại cả object: TypeORM so sánh jsonb theo tham chiếu, sửa tại chỗ
      // một trường con thì câu UPDATE không được sinh ra.
      existing.payload = {
        ...payload,
        // Tên thiệp lấy theo bản mới nhất: nếu chủ thiệp vừa đổi tên thì dòng
        // thông báo phải khớp với thứ họ thấy ở "Thiệp của tôi".
        cardTitle: event.cardTitle,
        cardSlug: event.cardSlug,
        count: payload.count + 1,
        latestName: event.guestName,
      };
      existing.lastEventAt = now;
      await this.notificationRepository.save(existing);
      return;
    }

    await this.notificationRepository.save(
      this.notificationRepository.create({
        userId: event.ownerId,
        type: 'wish_pending',
        groupKey,
        lastEventAt: now,
        readAt: null,
        payload: {
          cardId: event.cardId,
          cardSlug: event.cardSlug,
          cardTitle: event.cardTitle,
          count: 1,
          latestName: event.guestName,
        },
      }),
    );
  }

  /**
   * Tiền của một đơn vừa về. Mỗi đơn một dòng riêng, không gom nhóm và không cần
   * chống lặp: một đơn đã `paid` thì `markPaid` từ chối, nên không bắn hai lần.
   */
  async pushPaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    await this.notificationRepository.save(
      this.notificationRepository.create({
        userId: event.userId,
        type: 'payment_success',
        groupKey: `payment_success:${event.orderId}`,
        lastEventAt: new Date(),
        readAt: null,
        payload: {
          orderId: event.orderId,
          cardId: event.cardId,
          cardSlug: event.cardSlug,
          cardTitle: event.cardTitle,
        },
      }),
    );
  }

  /**
   * Chủ thiệp đã mở danh sách lời chúc của một thiệp — thông báo của thiệp đó
   * coi như đã đọc. Đánh dấu ở đây thay vì bắt bấm thêm một nút: người dùng đã
   * nhìn thấy đúng thứ mà thông báo báo, giữ chấm đỏ lại chỉ là nhiễu.
   */
  markWishGroupRead(userId: string, cardId: string): Promise<void> {
    return this.notificationRepository.markGroupRead(
      userId,
      wishGroupKey(cardId),
    );
  }
}

function wishGroupKey(cardId: string): string {
  return `wish_pending:${cardId}`;
}
