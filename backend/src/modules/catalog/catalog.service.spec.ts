import type { RevalidateService } from '@common/revalidate/revalidate.service';
import { CACHE_TAGS } from '@constant/cache-tags';
import type { SettingsService } from '@modules/settings/settings.service';
import type {
  TemplateRepository,
  TemplateViewRepository,
} from './catalog.repository';
import { CatalogService } from './catalog.service';
import type { Template } from './template.entity';

function template(partial: Partial<Template> = {}): Template {
  return {
    id: 'tpl-1',
    slug: 'moc-lan',
    name: 'Mộc Lan',
    tier: 'free',
    categories: [],
    colorTones: [],
    tags: [],
    photoSlots: [],
    imagePosition: '50% 50%',
    imageSrc: null,
    isPublished: true,
    sortOrder: 0,
    featuredOnHome: false,
    homepageOrder: 0,
    ...partial,
  } as Template;
}

function makeService(
  templateRepository: Partial<TemplateRepository>,
  homepageTemplateCount = 3,
  revalidateService: Pick<RevalidateService, 'ping'> = { ping: jest.fn() },
) {
  return new CatalogService(
    templateRepository as TemplateRepository,
    {
      find: jest.fn().mockResolvedValue({ homepageTemplateCount }),
    } as unknown as SettingsService,
    revalidateService as RevalidateService,
    {} as TemplateViewRepository,
  );
}

describe('CatalogService — dải mẫu trang chủ', () => {
  it('chưa chọn mẫu nào thì rơi về đầu kho, không để trang chủ trống', async () => {
    const service = makeService(
      {
        findFeaturedOnHome: jest.fn().mockResolvedValue([]),
        findPublished: jest
          .fn()
          .mockResolvedValue([
            template({ slug: 'a' }),
            template({ slug: 'b' }),
            template({ slug: 'c' }),
            template({ slug: 'd' }),
          ]),
      },
      3,
    );

    const result = await service.findHomepageTemplates();

    expect(result.map((item) => item.slug)).toEqual(['a', 'b', 'c']);
  });

  it('mẫu đã chọn hiện đủ, không cắt theo số ô', async () => {
    const featured = ['a', 'b', 'c', 'd', 'e'].map((slug) =>
      template({ slug, featuredOnHome: true }),
    );
    const service = makeService(
      {
        findFeaturedOnHome: jest.fn().mockResolvedValue(featured),
        findPublished: jest.fn(),
      },
      3,
    );

    const result = await service.findHomepageTemplates();

    expect(result.map((item) => item.slug)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('setHomepageTemplates gán thứ tự theo đúng vị trí gửi lên và hạ cờ mẫu ngoài danh sách', async () => {
    const all = [
      template({ slug: 'a' }),
      template({ slug: 'b' }),
      template({ slug: 'c', featuredOnHome: true, homepageOrder: 5 }),
    ];
    const save = jest.fn().mockResolvedValue(all);
    const revalidateService = { ping: jest.fn() };
    const service = makeService(
      {
        findAllPaged: jest.fn().mockResolvedValue([all, all.length]),
        save,
        findFeaturedOnHome: jest.fn().mockResolvedValue([]),
        findPublished: jest.fn().mockResolvedValue([]),
      },
      3,
      revalidateService,
    );

    await service.setHomepageTemplates(['b', 'a']);

    expect(all.find((item) => item.slug === 'b')).toMatchObject({
      featuredOnHome: true,
      homepageOrder: 0,
    });
    expect(all.find((item) => item.slug === 'a')).toMatchObject({
      featuredOnHome: true,
      homepageOrder: 1,
    });
    // `c` không còn trong danh sách nên phải bị gỡ khỏi trang chủ.
    expect(all.find((item) => item.slug === 'c')).toMatchObject({
      featuredOnHome: false,
      homepageOrder: 0,
    });
    expect(save).toHaveBeenCalledWith(all);
    expect(revalidateService.ping).toHaveBeenCalledWith([CACHE_TAGS.templates]);
  });

  it('đổi trạng thái mẫu thì xoá cache kho mẫu công khai', async () => {
    const current = template({ slug: 'a', isPublished: true });
    const save = jest.fn().mockResolvedValue({
      ...current,
      isPublished: false,
    });
    const revalidateService = { ping: jest.fn() };
    const service = makeService(
      {
        findBySlug: jest.fn().mockResolvedValue(current),
        save,
      },
      3,
      revalidateService,
    );

    await service.updateTemplate('a', { isPublished: false });

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'a', isPublished: false }),
    );
    expect(revalidateService.ping).toHaveBeenCalledWith([CACHE_TAGS.templates]);
  });

  it('slug lạ thì từ chối cả lệnh, không ghi một nửa', async () => {
    const save = jest.fn();
    const service = makeService({
      findAllPaged: jest.fn().mockResolvedValue([[template({ slug: 'a' })], 1]),
      save,
    });

    await expect(
      service.setHomepageTemplates(['a', 'khong-ton-tai']),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });
});

describe('CatalogService — lọc kho mẫu theo màu', () => {
  const catalog = [
    template({ slug: 'sen-viet', colorTones: ['green', 'red'] }),
    template({ slug: 'vuon-hen', colorTones: ['white', 'green'] }),
    template({ slug: 'bach-mai', colorTones: ['white'] }),
  ];
  const service = makeService({
    findPublished: jest.fn().mockResolvedValue(catalog),
  });

  it('một màu thì ra mọi mẫu mang màu đó, dù là màu nền hay màu concept', async () => {
    const result = await service.findTemplates({ color: ['green'] });

    expect(result.map((item) => item.slug)).toEqual(['sen-viet', 'vuon-hen']);
  });

  it('nhiều màu ghép bằng AND — chỉ ra mẫu mang đủ mọi màu đã chọn', async () => {
    const result = await service.findTemplates({ color: ['white', 'green'] });

    expect(result.map((item) => item.slug)).toEqual(['vuon-hen']);
  });

  it('không chọn màu thì không lọc', async () => {
    const result = await service.findTemplates({});

    expect(result).toHaveLength(3);
  });
});

describe('CatalogService — lượt xem mẫu', () => {
  function makeViewService() {
    const viewRepository = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new CatalogService(
      {} as TemplateRepository,
      {} as SettingsService,
      { ping: jest.fn() } as unknown as RevalidateService,
      viewRepository as unknown as TemplateViewRepository,
    );
    return { service, viewRepository };
  }

  afterEach(() => jest.useRealTimers());

  it('ghi vào ngày theo giờ Việt Nam', async () => {
    // 20:00 UTC ngày 9 = 03:00 sáng ngày 10 ở Việt Nam.
    jest.useFakeTimers().setSystemTime(new Date('2026-10-09T20:00:00Z'));
    const { service, viewRepository } = makeViewService();

    await service.recordTemplateView('lan-trang', 'demo');

    expect(viewRepository.record).toHaveBeenCalledWith(
      '2026-10-10',
      'lan-trang',
      'demo',
    );
  });

  it('bỏ qua slug dài bất thường thay vì đẩy xuống database', async () => {
    const { service, viewRepository } = makeViewService();

    await service.recordTemplateView('x'.repeat(61), 'open');

    expect(viewRepository.record).not.toHaveBeenCalled();
  });
});
