import { DEFAULT_TEMPLATE_SLUG } from '@common/constants/invitation.constants';
import type { RevalidateService } from '@common/revalidate/revalidate.service';
import { ERROR_CODES } from '@constant/error-codes';
import { ERROR_MESSAGES } from '@constant/error-messages';
import type {
  TemplateRepository,
  TemplateViewRepository,
} from '@modules/catalog/catalog.repository';
import { CatalogService } from '@modules/catalog/catalog.service';
import { createEmptyContent } from '@modules/cards/empty-content';
import type { SettingsService } from '@modules/settings/settings.service';
import { CardsService } from '@modules/cards/cards.service';
import { CardsRepository } from '@modules/cards/cards.repository';
import { CardGuest } from '@modules/cards/card-guest.entity';
import { StoredContent, WeddingCard } from '@modules/cards/wedding-card.entity';

describe('CardsService — lưu nội dung và khách mời', () => {
  function setup(existingGuests: Partial<CardGuest>[] = []) {
    // Thiệp cưới phải đủ tên và một nghi lễ — `assertContentForKind` chặn
    // trước mọi luật khác của lượt lưu.
    const before = {
      album: { photos: [] },
      couple: { groomFullName: 'An', brideFullName: 'Bình' },
      ceremonies: [{ kind: 'groom', customKind: '' }],
      guestInvite: { guestList: 'Khách cũ' },
    } as unknown as StoredContent;
    const next = {
      ...before,
      guestInvite: { guestList: 'Khách cũ\nKhách mới' },
    } as unknown as StoredContent;
    const card = {
      id: 'card-1',
      slug: 'existing-couple-link',
      title: 'Thiệp cũ',
      status: 'paid',
      planTier: 'diamond',
      paidAt: new Date(),
      content: before,
      groomSlug: 'groom-existing',
      brideSlug: 'bride-existing',
    } as WeddingCard;
    const keptGuest = {
      id: 'guest-1',
      cardId: card.id,
      name: 'Khách cũ',
      side: 'groom',
      position: 0,
      token: 'keep-this-token',
    } as CardGuest;
    const saveWithGuests = jest
      .fn()
      .mockImplementation((value: WeddingCard) => Promise.resolve(value));
    const repository = { saveWithGuests } as unknown as CardsRepository;
    const guests = {
      findByCard: jest
        .fn()
        .mockResolvedValue([keptGuest, ...(existingGuests as CardGuest[])]),
      create: jest.fn((guest: Partial<CardGuest>) => guest),
    };
    const prepare = jest
      .fn()
      .mockImplementation((_id, _slots, content: StoredContent) =>
        Promise.resolve(content.sharePreview),
      );
    const dependencies = [
      repository,
      {},
      {},
      guests,
      {
        findCardTemplate: jest
          .fn()
          .mockResolvedValue({ photoSlots: ['cover'] }),
      },
      {},
      {},
      {},
      { prepare },
    ] as unknown as ConstructorParameters<typeof CardsService>;
    const service = new CardsService(...dependencies);
    jest.spyOn(service, 'findOneForOwner').mockResolvedValue(card);
    return {
      service,
      card,
      before,
      next,
      saveWithGuests,
      guests,
      keptGuest,
      prepare,
    };
  }

  it('lưu nội dung và danh sách khách cùng nhau, giữ mã link khách cũ', async () => {
    const { service, card, next, saveWithGuests, keptGuest } = setup();
    await expect(
      service.update('owner', card.id, { title: 'Tiêu đề mới', content: next }),
    ).resolves.toMatchObject({ title: 'Tiêu đề mới', content: next });
    expect(saveWithGuests).toHaveBeenCalledWith(card, {
      save: [
        keptGuest,
        expect.objectContaining({ name: 'Khách mới', side: 'groom' }),
      ],
      remove: [],
    });
    expect(keptGuest.token).toBe('keep-this-token');
  });

  it('chấp nhận rồi bỏ `familySplit` và `viewSide` của gói Song Hỷ đã gỡ', async () => {
    const { service, card, next } = setup();
    const legacy = next as unknown as Record<string, unknown>;
    legacy.familySplit = {
      enabled: true,
      brideGuestList: 'Khách nhà gái',
    };
    legacy.viewSide = 'bride';
    const saved = await service.update('owner', card.id, { content: next });
    expect(saved.content).not.toHaveProperty('familySplit');
    expect(saved.content).not.toHaveProperty('viewSide');
  });

  it('khách nhà gái còn lại từ Song Hỷ không bị xoá khi lưu danh sách', async () => {
    const brideGuest = {
      id: 'guest-2',
      cardId: 'card-1',
      name: 'Khách nhà gái',
      side: 'bride',
      position: 0,
      token: 'bride-token',
    } as CardGuest;
    const { service, card, next, saveWithGuests } = setup([brideGuest]);
    await service.update('owner', card.id, { content: next });
    const [, plan] = saveWithGuests.mock.calls[0] as [
      WeddingCard,
      { save: CardGuest[]; remove: CardGuest[] },
    ];
    expect(plan.remove).toEqual([]);
    expect(plan.save).not.toContain(brideGuest);
  });

  it('chỉ đổi Open Graph thì giữ slug chung, slug hai nhà cũ và token khách cũ', async () => {
    const { service, card, next, before, keptGuest, prepare } = setup();
    next.guestInvite = before.guestInvite;
    next.sharePreview = { mode: 'auto', photoUrl: '', positionY: 50 };
    const links = [card.slug, card.groomSlug, card.brideSlug, keptGuest.token];
    await service.update('owner', card.id, { content: next });
    expect(prepare).toHaveBeenCalled();
    expect([
      card.slug,
      card.groomSlug,
      card.brideSlug,
      keptGuest.token,
    ]).toEqual(links);
    expect(card.status).toBe('paid');
  });
});

describe('CardsService — xuất bản và xem công khai', () => {
  function setup(card: Partial<WeddingCard>) {
    const saved = jest
      .fn()
      .mockImplementation((value: WeddingCard) => Promise.resolve(value));
    const repository = {
      save: saved,
      slugExists: jest.fn().mockResolvedValue(false),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      incrementViewCount: jest.fn().mockResolvedValue(99),
    };
    const aliases = { slugExists: jest.fn().mockResolvedValue(false) };
    const views = {
      hasViewed: jest.fn().mockResolvedValue(false),
      record: jest.fn().mockResolvedValue(true),
    };
    const guests = { findByToken: jest.fn().mockResolvedValue(null) };
    const dependencies = [
      repository,
      aliases,
      views,
      guests,
      {},
      {},
      {},
      {},
      {},
    ] as unknown as ConstructorParameters<typeof CardsService>;
    const service = new CardsService(...dependencies);
    const content = createEmptyContent();
    content.couple.groomFullName = 'An';
    content.couple.brideFullName = 'Bình';
    const target = {
      id: 'card-1',
      slug: 'thiep-1a2b3c4d',
      status: 'draft',
      planTier: 'diamond',
      paidAt: null,
      publishedAt: null,
      expiresAt: null,
      viewCount: 0,
      content,
      ...card,
    } as WeddingCard;
    jest.spyOn(service, 'findOneForOwner').mockResolvedValue(target);
    repository.findById.mockResolvedValue(target);
    return { service, target, repository, views };
  }

  it('thiệp chưa thanh toán không xuất bản được: PAYMENT_REQUIRED', async () => {
    const { service, target } = setup({});
    await expect(service.publish('owner', target.id)).rejects.toMatchObject({
      status: 403,
      response: {
        code: 'PAYMENT_REQUIRED',
        message: ERROR_MESSAGES.CARD.PAYMENT_REQUIRED,
      },
    });
    expect(target.status).toBe('draft');
  });

  it('tiền về: status paid, link vĩnh viễn, mở mốc khoá tên 15 ngày', async () => {
    const { service, target } = setup({});
    const card = await service.activateAfterPayment(target.id);
    expect(card.status).toBe('paid');
    expect(card.publishedAt).toBeInstanceOf(Date);
    expect(card.paidAt).toBe(card.publishedAt);
    expect(card.expiresAt).toBeNull();
  });

  it('xuất bản lại không dời mốc `paidAt`', async () => {
    const paidAt = new Date('2026-01-01T00:00:00Z');
    const { service, target } = setup({
      status: 'paid',
      paidAt,
      publishedAt: paidAt,
    });
    const card = await service.publish('owner', target.id);
    expect(card.paidAt).toBe(paidAt);
    const again = await service.activateAfterPayment(target.id);
    expect(again.paidAt).toBe(paidAt);
  });

  it('thiệp đã xuất bản không bị chặn bởi hạn hay trần người xem, vẫn ghi lượt xem', async () => {
    const { service, target, repository, views } = setup({
      status: 'paid',
      viewCount: 500,
      expiresAt: new Date(Date.now() - 1000),
    });
    repository.findBySlug.mockResolvedValue(target);

    const result = await service.findPublicBySlug('slug', 'visitor-1');

    expect(views.record).toHaveBeenCalledWith('card-1', 'visitor-1');
    expect(result.card.viewCount).toBe(99);
    expect(result.card.expiresAt).toBeNull();
    expect(result.card.status).toBe('paid');
  });

  it('thiệp cũ còn `unpaid`/`free` vẫn mở được và trả trạng thái paid', async () => {
    for (const status of ['free', 'unpaid'] as unknown as 'paid'[]) {
      const { service, target, repository } = setup({ status });
      repository.findBySlug.mockResolvedValue(target);
      const result = await service.findPublicBySlug('slug');
      expect(result.card.status).toBe('paid');
    }
  });

  it('thiệp nháp là 404 với khách', async () => {
    const { service, target, repository } = setup({ status: 'draft' });
    repository.findBySlug.mockResolvedValue(target);
    await expect(service.findPublicBySlug('slug')).rejects.toThrow(
      ERROR_MESSAGES.CARD.NOT_FOUND,
    );
  });

  it('không lộ danh sách khách, `familySplit` cũ và đường dẫn riêng cũ', async () => {
    const { service, target, repository } = setup({
      status: 'paid',
      groomSlug: 'old-groom',
      brideSlug: 'old-bride',
    });
    target.content.guestInvite = { enabled: true, guestList: 'Bí mật' };
    (target.content as unknown as Record<string, unknown>).familySplit = {
      enabled: true,
      brideGuestList: 'Bí mật nhà gái',
    };
    repository.findBySlug.mockResolvedValue(target);

    const { card } = await service.findPublicBySlug('old-bride');

    expect(card.content.guestInvite.guestList).toBe('');
    expect(card.content).not.toHaveProperty('familySplit');
    expect(card.groomSlug).toBeNull();
    expect(card.brideSlug).toBeNull();
  });

  it('mã link riêng đúng thì chào bằng tên, không phân biệt nhà', async () => {
    const { service, target, repository } = setup({ status: 'paid' });
    target.content.guestInvite = { enabled: true, guestList: '' };
    repository.findBySlug.mockResolvedValue(target);
    const findByToken = (
      service as unknown as {
        cardGuestRepository: { findByToken: jest.Mock };
      }
    ).cardGuestRepository.findByToken;
    findByToken.mockResolvedValue({ name: 'Bạn Minh', side: 'bride' });

    const result = await service.findPublicBySlug('slug', undefined, 'tok');

    expect(result.guestName).toBe('Bạn Minh');
  });
});

describe('CardsService — lịch ngày cưới', () => {
  function setup() {
    const repository = {
      findWeddingsByDate: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    const dependencies = [
      repository,
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
    ] as unknown as ConstructorParameters<typeof CardsService>;
    return { service: new CardsService(...dependencies), repository };
  }

  afterEach(() => jest.useRealTimers());

  it('"hôm nay" là ngày theo giờ Việt Nam, không theo UTC', async () => {
    // 18:00 UTC ngày 9 = 01:00 sáng ngày 10 ở Việt Nam.
    jest.useFakeTimers().setSystemTime(new Date('2026-10-09T18:00:00Z'));
    const { service, repository } = setup();

    await service.findWeddingsByDate({ withinDays: 7 });

    expect(repository.findWeddingsByDate).toHaveBeenCalledWith({
      scope: 'upcoming',
      today: '2026-10-10',
      bound: '2026-10-17',
      limit: 20,
      offset: 0,
    });
  });

  it('đã qua thì biên lùi về quá khứ', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-09T03:00:00Z'));
    const { service, repository } = setup();

    await service.findWeddingsByDate({ scope: 'past', withinDays: 30 });

    expect(repository.findWeddingsByDate).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'past',
        today: '2026-10-09',
        bound: '2026-09-09',
      }),
    );
  });
});

describe('CardsService — loại thiệp', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function birthdayContent(name = 'Minh Anh'): StoredContent {
    const content = createEmptyContent('birthday');
    content.occasion = { ...content.occasion!, name };
    return content;
  }

  function weddingContent(): StoredContent {
    const content = createEmptyContent();
    content.couple.groomFullName = 'Tuấn Anh';
    content.couple.brideFullName = 'Như Bình';
    content.ceremonies[0] = {
      ...content.ceremonies[0],
      dateTime: '2026-11-22T10:00:00+07:00',
      venue: 'Tư gia nhà trai',
    };
    return content;
  }

  function setup(card: Partial<WeddingCard>) {
    const passThrough = jest
      .fn()
      .mockImplementation((value: WeddingCard) => Promise.resolve(value));
    const repository = {
      create: jest.fn((value: Partial<WeddingCard>) => value),
      save: passThrough,
      saveWithGuests: passThrough,
      slugExists: jest.fn().mockResolvedValue(false),
      findById: jest.fn(),
    };
    const aliases = { slugExists: jest.fn().mockResolvedValue(false) };
    const guests = {
      findByCard: jest.fn().mockResolvedValue([]),
      create: jest.fn((guest: Partial<CardGuest>) => guest),
    };
    // Catalog thật với kho rỗng: mẫu dựng sẵn không được đụng tới kho.
    const findBySlug = jest.fn().mockResolvedValue(null);
    const catalog = new CatalogService(
      { findBySlug } as unknown as TemplateRepository,
      {} as SettingsService,
      {} as RevalidateService,
      {} as TemplateViewRepository,
    );
    const dependencies = [
      repository,
      aliases,
      {},
      guests,
      catalog,
      {},
      {},
      {},
      {},
    ] as unknown as ConstructorParameters<typeof CardsService>;
    const service = new CardsService(...dependencies);
    const target = {
      id: 'card-1',
      slug: 'thiep-1a2b3c4d',
      status: 'draft',
      planTier: 'diamond',
      paidAt: null,
      coupleNamesUnlocked: false,
      ...card,
    } as WeddingCard;
    jest.spyOn(service, 'findOneForOwner').mockResolvedValue(target);
    repository.findById.mockResolvedValue(target);
    return { service, target, repository, findBySlug };
  }

  it('tạo thiệp trên mẫu dựng sẵn: planTier diamond, nội dung theo loại, không chạm kho', async () => {
    const { service, findBySlug } = setup({});
    const card = await service.create('owner', {
      templateSlug: DEFAULT_TEMPLATE_SLUG,
      kind: 'birthday',
    });
    expect(findBySlug).not.toHaveBeenCalled();
    expect(card).toMatchObject({
      templateSlug: DEFAULT_TEMPLATE_SLUG,
      templateTier: 'free',
      planTier: 'diamond',
    });
    expect(card.content.kind).toBe('birthday');
    expect(card.content.occasion?.name).toBe('');
  });

  it('thiếu `kind` khi tạo thì là thiệp cưới', async () => {
    const { service } = setup({});
    const card = await service.create('owner', {
      templateSlug: DEFAULT_TEMPLATE_SLUG,
    });
    expect(card.content.kind).toBe('wedding');
  });

  it('mẫu trong kho chỉ dựng được thiệp đúng loại của nó', async () => {
    const { service, findBySlug } = setup({});
    findBySlug.mockResolvedValue({
      slug: 'burgundy-birthday',
      name: 'Burgundy',
      tier: 'gold',
      kind: 'birthday',
      photoSlots: ['cover'],
    });
    await expect(
      service.create('owner', { templateSlug: 'burgundy-birthday' }),
    ).rejects.toThrow(ERROR_MESSAGES.CARD.TEMPLATE_KIND_MISMATCH);

    const card = await service.create('owner', {
      templateSlug: 'burgundy-birthday',
      kind: 'birthday',
    });
    expect(card).toMatchObject({
      templateSlug: 'burgundy-birthday',
      templateTier: 'gold',
      planTier: 'diamond',
    });
    expect(card.content.kind).toBe('birthday');
  });

  it('mẫu dựng sẵn không "tim" được và không có trong kho', async () => {
    const catalog = new CatalogService(
      {
        findBySlug: jest.fn().mockResolvedValue(null),
      } as unknown as TemplateRepository,
      {} as SettingsService,
      {} as RevalidateService,
      {} as TemplateViewRepository,
    );
    await expect(
      catalog.findTemplateBySlug(DEFAULT_TEMPLATE_SLUG),
    ).rejects.toThrow(ERROR_MESSAGES.CATALOG.TEMPLATE_NOT_FOUND);
    await expect(
      catalog.findCardTemplate(DEFAULT_TEMPLATE_SLUG),
    ).resolves.toMatchObject({ tier: 'free', photoSlots: [] });
  });

  it('không đổi được loại thiệp sau khi tạo', async () => {
    const { service, target, repository } = setup({
      content: birthdayContent(),
    });
    await expect(
      service.update('owner', target.id, { content: weddingContent() }),
    ).rejects.toThrow(ERROR_MESSAGES.CARD.KIND_IMMUTABLE);
    // Bỏ `kind` cũng là đổi loại: vắng khoá nghĩa là thiệp cưới.
    const withoutKind = birthdayContent();
    delete withoutKind.kind;
    await expect(
      service.update('owner', target.id, {
        content: withoutKind,
      }),
    ).rejects.toThrow(ERROR_MESSAGES.CARD.KIND_IMMUTABLE);
    expect(repository.saveWithGuests).not.toHaveBeenCalled();
  });

  it('thiệp cưới vẫn bắt buộc đủ tên và một nghi lễ, lỗi đúng hình dạng ValidationPipe', async () => {
    const { service, target } = setup({ content: weddingContent() });
    const next = weddingContent();
    next.couple.brideFullName = '';
    next.ceremonies = [];
    await expect(
      service.update('owner', target.id, { content: next }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: [
          'couple.brideFullName should not be empty',
          'ceremonies must contain at least 1 elements',
        ],
      },
    });
  });

  it('thiệp sinh nhật lưu được khi tên cặp đôi rỗng và không có nghi lễ', async () => {
    const { service, target, repository } = setup({
      content: birthdayContent(),
    });
    const next = birthdayContent('Minh Anh 30 tuổi');
    await service.update('owner', target.id, { content: next });
    expect(repository.saveWithGuests).toHaveBeenCalled();
    expect(target.content).toBe(next);
  });

  it('thiệp không phải thiệp cưới bắt buộc `occasion.name`', async () => {
    const { service, target } = setup({ content: birthdayContent() });
    await expect(
      service.update('owner', target.id, { content: birthdayContent('   ') }),
    ).rejects.toThrow(ERROR_MESSAGES.CARD.OCCASION_NAME_REQUIRED);
  });

  it('xuất bản lần đầu dựng đường dẫn từ `occasion.name`', async () => {
    const { service, target } = setup({ content: birthdayContent() });
    const card = await service.activateAfterPayment(target.id);
    expect(card.status).toBe('paid');
    expect(card.slug).toMatch(/^minh-anh-[0-9a-f]{4}$/);
  });

  it('xuất bản thiệp cưới vẫn dựng đường dẫn từ tên cô dâu chú rể', async () => {
    const { service, target } = setup({ content: weddingContent() });
    const card = await service.activateAfterPayment(target.id);
    expect(card.slug).toMatch(/^tuan-anh-nhu-binh-[0-9a-f]{4}$/);
  });

  it('không xuất bản được thiệp chưa có tên', async () => {
    const { service, target } = setup({
      content: createEmptyContent('event'),
    });
    await expect(service.publish('owner', target.id)).rejects.toThrow(
      ERROR_MESSAGES.CARD.OCCASION_NAME_REQUIRED_TO_PUBLISH,
    );
  });

  it('quá 15 ngày sau thanh toán thì khoá tên người được mừng, các ô khác vẫn sửa được', async () => {
    const { service, target } = setup({
      status: 'paid',
      paidAt: new Date(Date.now() - 16 * DAY_MS),
      content: birthdayContent(),
    });
    await expect(
      service.update('owner', target.id, {
        content: birthdayContent('Người khác'),
      }),
    ).rejects.toMatchObject({
      response: { code: ERROR_CODES.COUPLE_NAMES_LOCKED },
    });

    const sameName = birthdayContent();
    sameName.occasion!.age = '30';
    await expect(
      service.update('owner', target.id, { content: sameName }),
    ).resolves.toBeDefined();
  });

  it('admin mở khoá thì sửa được tên ở mọi loại', async () => {
    const { service, target } = setup({
      status: 'paid',
      paidAt: new Date(Date.now() - 16 * DAY_MS),
      coupleNamesUnlocked: true,
      content: birthdayContent(),
    });
    await expect(
      service.update('owner', target.id, {
        content: birthdayContent('Người khác'),
      }),
    ).resolves.toBeDefined();
  });
});
