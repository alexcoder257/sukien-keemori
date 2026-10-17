import { NotFoundException } from '@nestjs/common';
import type { Notification, WishPendingPayload } from './notification.entity';
import type { NotificationRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

const OWNER = 'user-1';
const CARD = 'card-1';
const GROUP = `wish_pending:${CARD}`;

function notification(partial: Partial<Notification> = {}): Notification {
  return {
    id: 'notification-1',
    userId: OWNER,
    type: 'wish_pending',
    groupKey: GROUP,
    lastEventAt: new Date('2026-01-01T00:00:00Z'),
    readAt: null,
    payload: {
      cardId: CARD,
      cardSlug: 'an-linh',
      cardTitle: 'An & Linh',
      count: 1,
      latestName: 'Hoài Nam',
    },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...partial,
  } as Notification;
}

/** Repository giả: mọi phương thức là `jest.Mock`, ép kiểu đúng một lần ở đây. */
type MockRepository = Partial<Record<keyof NotificationRepository, jest.Mock>>;

function makeService(repository: MockRepository) {
  return {
    service: new NotificationsService(
      repository as unknown as NotificationRepository,
    ),
    repository,
  };
}

/**
 * `create` và `save` được đọc qua `mock.calls` thay vì `toHaveBeenCalledWith`:
 * các matcher kiểu `expect.objectContaining` trả về `any` và lint của dự án
 * chặn mọi giá trị `any`.
 */
type CreateMock = jest.Mock<Notification, [Partial<Notification>]>;
type SaveMock = jest.Mock<Promise<Notification>, [Notification]>;

const EVENT = {
  ownerId: OWNER,
  cardId: CARD,
  cardSlug: 'an-linh',
  cardTitle: 'An & Linh',
  guestName: 'Tuấn Anh',
};

describe('NotificationsService', () => {
  describe('pushWishPending', () => {
    it('tạo thông báo mới khi thiệp chưa có bản chưa đọc nào', async () => {
      const create: CreateMock = jest.fn(
        (input: Partial<Notification>) => input as Notification,
      );
      const { service } = makeService({
        findUnreadByGroup: jest.fn().mockResolvedValue(null),
        create,
        save: jest.fn(),
      });

      await service.pushWishPending(EVENT);

      const created = create.mock.calls[0][0];
      expect(created.userId).toBe(OWNER);
      expect(created.type).toBe('wish_pending');
      expect(created.groupKey).toBe(GROUP);
      expect(created.readAt).toBeNull();
      expect((created.payload as WishPendingPayload).count).toBe(1);
      expect((created.payload as WishPendingPayload).latestName).toBe(
        'Tuấn Anh',
      );
    });

    it('cộng dồn vào thông báo chưa đọc của cùng thiệp thay vì tạo dòng mới', async () => {
      const existing = notification({
        payload: {
          cardId: CARD,
          cardSlug: 'an-linh',
          cardTitle: 'An & Linh',
          count: 2,
          latestName: 'Hoài Nam',
        },
      });
      const save = jest.fn<Promise<Notification>, [Notification]>(() =>
        Promise.resolve(existing),
      ) satisfies SaveMock;
      const create = jest.fn();
      const { service } = makeService({
        findUnreadByGroup: jest.fn().mockResolvedValue(existing),
        create,
        save,
      });

      await service.pushWishPending(EVENT);

      expect(create).not.toHaveBeenCalled();
      const saved = save.mock.calls[0][0];
      expect((saved.payload as WishPendingPayload).count).toBe(3);
      // Tên người gửi gần nhất được thay, để câu thông báo nói về lời chúc vừa
      // tới chứ không phải lời chúc đầu tiên của nhóm.
      expect((saved.payload as WishPendingPayload).latestName).toBe('Tuấn Anh');
    });

    it('không cộng dồn vào thông báo đã đọc — đọc rồi thì lần sau là dòng mới', async () => {
      const create = jest.fn((input: unknown) => input);
      const findUnreadByGroup = jest.fn().mockResolvedValue(null);
      const { service } = makeService({
        findUnreadByGroup,
        create,
        save: jest.fn(),
      });

      await service.pushWishPending(EVENT);

      // Repository chỉ tìm trong nhóm **chưa đọc**; đã đọc rơi ra ngoài phép
      // tìm nên nhánh tạo mới được chạy.
      expect(findUnreadByGroup).toHaveBeenCalledWith(OWNER, GROUP);
      expect(create).toHaveBeenCalled();
    });
  });

  describe('markRead', () => {
    it('ném NotFound khi thông báo không thuộc về người gọi', async () => {
      const { service } = makeService({
        findOneForUser: jest.fn().mockResolvedValue(null),
      });

      await expect(service.markRead(OWNER, 'notification-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('không ghi lại mốc đã đọc nếu thông báo đã đọc từ trước', async () => {
      const save = jest.fn();
      const { service } = makeService({
        findOneForUser: jest
          .fn()
          .mockResolvedValue(notification({ readAt: new Date() })),
        save,
      });

      await service.markRead(OWNER, 'notification-1');

      expect(save).not.toHaveBeenCalled();
    });
  });

  describe('pushPaymentSuccess', () => {
    it('tạo một dòng riêng cho mỗi đơn, không gom nhóm', async () => {
      const create = jest.fn((value: Partial<Notification>) => value);
      const { service } = makeService({
        create,
        save: jest.fn().mockResolvedValue(undefined),
      });

      await service.pushPaymentSuccess({
        userId: OWNER,
        orderId: 'order-1',
        cardId: CARD,
        cardSlug: 'an-linh',
        cardTitle: 'An & Linh',
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: OWNER,
          type: 'payment_success',
          groupKey: 'payment_success:order-1',
          readAt: null,
        }),
      );
    });
  });
});
