import { BadRequestException } from '@nestjs/common';
import type { CardsService } from '@modules/cards/cards.service';
import type { RsvpRepository } from './interactions.repository';
import type { Rsvp } from './rsvp.entity';
import { RsvpsService } from './rsvps.service';

const DTO = { name: 'Anh Chị Cường Thu', attending: true, partySize: 2 };

function makeService({
  rsvpEnabled = true,
  guest = null as { id: string } | null,
  existing = null as Partial<Rsvp> | null,
  /** Lượt `save` đầu tiên vấp unique index, như khi hai lượt gửi chạy song song. */
  uniqueRace = false,
} = {}) {
  const card = {
    id: 'card-1',
    status: 'paid',
    content: { visibility: { rsvp: rsvpEnabled } },
  };
  const findInvitedGuest = jest.fn(() => Promise.resolve(guest));
  let failNextSave = uniqueRace;
  const rsvpRepository = {
    findByGuest: jest.fn(() => Promise.resolve(existing as Rsvp | null)),
    create: jest.fn((fields: Partial<Rsvp>) => ({ ...fields }) as Rsvp),
    save: jest.fn((entity: Rsvp) => {
      if (failNextSave) {
        failNextSave = false;
        return Promise.reject(
          Object.assign(new Error('duplicate key'), { code: '23505' }),
        );
      }
      return Promise.resolve(entity);
    }),
  };
  const service = new RsvpsService(
    rsvpRepository as unknown as RsvpRepository,
    {
      findBySlugOrFail: jest.fn(() => Promise.resolve(card)),
      findInvitedGuest,
    } as unknown as CardsService,
  );
  return { service, rsvpRepository, findInvitedGuest };
}

describe('RsvpsService.submitFromGuest', () => {
  it('từ chối khi thiệp đang tắt xác nhận tham dự', async () => {
    const { service, rsvpRepository } = makeService({ rsvpEnabled: false });

    await expect(service.submitFromGuest('slug', DTO)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(rsvpRepository.save).not.toHaveBeenCalled();
  });

  it('link chung: ghi một dòng mới không gắn khách nào', async () => {
    const { service, rsvpRepository } = makeService();

    await service.submitFromGuest('slug', DTO);

    expect(rsvpRepository.findByGuest).not.toHaveBeenCalled();
    expect(rsvpRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ guestId: null, partySize: 2 }),
    );
  });

  it('không tham dự thì số người về 0 dù form gửi lên số khác', async () => {
    const { service } = makeService();

    const receipt = await service.submitFromGuest('slug', {
      ...DTO,
      attending: false,
    });

    expect(receipt).toEqual({ attending: false, partySize: 0 });
  });

  it('chuyển mã link cho CardsService quyết định, không tự tra', async () => {
    const { service, findInvitedGuest } = makeService();

    await service.submitFromGuest('slug', { ...DTO, guestToken: 'abcd1234' });

    expect(findInvitedGuest).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'card-1' }),
      'abcd1234',
    );
  });

  it('link riêng đã có phản hồi: sửa đúng dòng đó thay vì tạo dòng mới', async () => {
    const existing = { id: 'rsvp-1', guestId: 'guest-1', attending: true };
    const { service, rsvpRepository } = makeService({
      guest: { id: 'guest-1' },
      existing,
    });

    await service.submitFromGuest('slug', { ...DTO, attending: false });

    expect(rsvpRepository.create).not.toHaveBeenCalled();
    expect(rsvpRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rsvp-1', attending: false, partySize: 0 }),
    );
  });

  it('hai lượt gửi cùng lúc từ một link: lượt vấp unique index ghi đè lên dòng vừa tạo', async () => {
    const { service, rsvpRepository } = makeService({
      guest: { id: 'guest-1' },
      uniqueRace: true,
    });
    rsvpRepository.findByGuest
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'rsvp-winner', guestId: 'guest-1' } as Rsvp);

    const receipt = await service.submitFromGuest('slug', DTO);

    expect(receipt).toEqual({ attending: true, partySize: 2 });
    expect(rsvpRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'rsvp-winner' }),
    );
  });
});
