import { BadRequestException } from '@nestjs/common';
import type {
  CoupleShowcaseRepository,
  FaqRepository,
  SiteStatRepository,
} from './content.repository';
import { ContentService } from './content.service';
import { SITE_STAT_KEYS } from './site-stat.entity';
import type { RevalidateService } from '@common/revalidate/revalidate.service';

describe('ContentService — số liệu công bố', () => {
  function makeStatsService(siteStatRepository: Partial<SiteStatRepository>) {
    return new ContentService(
      {} as FaqRepository,
      {} as CoupleShowcaseRepository,
      siteStatRepository as SiteStatRepository,
      { ping: jest.fn() } as unknown as RevalidateService,
    );
  }

  it('trả đủ mọi khoá trong whitelist, khoá chưa có hàng thì 0', async () => {
    const service = makeStatsService({
      findAllOrdered: jest
        .fn()
        .mockResolvedValue([{ key: 'home.rating', value: '4.90' }]),
    });

    const stats = await service.findAllSiteStats();

    expect(stats).toHaveLength(SITE_STAT_KEYS.length);
    expect(stats).toContainEqual({ key: 'home.rating', value: 4.9 });
    expect(stats).toContainEqual({ key: 'home.invitations', value: 0 });
  });

  it('lưu xong trả lại dải vừa đọc lại từ bảng', async () => {
    const upsertMany = jest.fn().mockResolvedValue(undefined);
    const service = makeStatsService({
      upsertMany,
      findAllOrdered: jest
        .fn()
        .mockResolvedValue([{ key: 'home.templates', value: '90.00' }]),
    });

    const stats = await service.updateSiteStats({
      stats: [{ key: 'home.templates', value: 90 }],
    });

    expect(upsertMany).toHaveBeenCalledWith([
      { key: 'home.templates', value: 90 },
    ]);
    expect(stats).toContainEqual({ key: 'home.templates', value: 90 });
  });
});

describe('ContentService — sắp xếp dải cặp đôi', () => {
  function makeShowcaseService(existing: string[]) {
    const reorder = jest.fn().mockResolvedValue(undefined);
    const service = new ContentService(
      {} as FaqRepository,
      {
        findAllIds: jest.fn().mockResolvedValue(existing),
        reorder,
      } as unknown as CoupleShowcaseRepository,
      {} as SiteStatRepository,
      { ping: jest.fn() } as unknown as RevalidateService,
    );
    return { service, reorder };
  }

  it('ghi theo đúng thứ tự gửi lên', async () => {
    const { service, reorder } = makeShowcaseService(['a', 'b', 'c']);

    await service.reorderCoupleShowcases(['c', 'a', 'b']);

    expect(reorder).toHaveBeenCalledWith(['c', 'a', 'b']);
  });

  it.each([
    ['thiếu một ô', ['a', 'b']],
    ['có ô không tồn tại', ['a', 'b', 'x']],
  ])('%s thì từ chối — danh sách ở CMS đã cũ', async (_, ids) => {
    const { service, reorder } = makeShowcaseService(['a', 'b', 'c']);

    await expect(service.reorderCoupleShowcases(ids)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(reorder).not.toHaveBeenCalled();
  });
});
