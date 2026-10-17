import { WishesService } from './wishes.service';
import type { WishRepository } from './interactions.repository';
import type { CardsService } from '@modules/cards/cards.service';
import type { NotificationsService } from '@modules/notifications/notifications.service';
import type { RevalidateService } from '@common/revalidate/revalidate.service';
import type { Wish } from './wish.entity';

const CARD = { id: 'card-1', slug: 'tuan-anh-nhu-binh-adec' };

function makeService(wish: Partial<Wish> | null = { id: 'wish-1' }) {
  const ping = jest.fn();
  const wishRepository = {
    findOneForCard: jest.fn(() => Promise.resolve(wish as Wish | null)),
    save: jest.fn((entity: Wish) => Promise.resolve(entity)),
    remove: jest.fn(() => Promise.resolve(undefined)),
  };
  const service = new WishesService(
    wishRepository as unknown as WishRepository,
    {
      assertOwner: jest.fn(() => Promise.resolve(CARD)),
    } as unknown as CardsService,
    {} as NotificationsService,
    { ping } as unknown as RevalidateService,
  );
  return { service, ping, wishRepository };
}

describe('WishesService — xoá cache lời chúc', () => {
  it('duyệt một lời chúc thì xoá cache của đúng thiệp đó', async () => {
    const { service, ping } = makeService();

    await service.setApproved('card-1', 'wish-1', 'owner-1', true);

    // Tag theo từng thiệp: duyệt lời chúc ở thiệp này không được xoá cache lời
    // chúc của mọi thiệp khác đang được xem.
    expect(ping).toHaveBeenCalledWith([`card-wishes:${CARD.slug}`]);
  });

  it('xoá một lời chúc cũng xoá cache của thiệp đó', async () => {
    const { service, ping } = makeService();

    await service.remove('card-1', 'wish-1', 'owner-1');

    expect(ping).toHaveBeenCalledWith([`card-wishes:${CARD.slug}`]);
  });

  it('không xoá cache khi lời chúc không tồn tại', async () => {
    const { service, ping } = makeService(null);

    await expect(
      service.setApproved('card-1', 'wish-1', 'owner-1', true),
    ).rejects.toThrow();
    expect(ping).not.toHaveBeenCalled();
  });
});
