import { createHash } from 'node:crypto';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CardsService } from '@modules/cards/cards.service';
import type { StagedPhoto } from './staged-photo.entity';
import { STAGING_STORAGE } from './staging.types';
import { MAX_UPLOAD_BYTES, STAGED_PRIORITY } from './storage.constants';
import { STORAGE_PROVIDER } from './storage.types';
import type { UploadSession } from './upload-session.entity';
import {
  StagedPhotoRepository,
  UploadSessionRepository,
} from './upload-staging.repository';
import { UploadStagingService } from './upload-staging.service';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const CARD_ID = '22222222-2222-4222-8222-222222222222';
const PHOTO_ID = '33333333-3333-4333-8333-333333333333';
const SECRET = 'a'.repeat(43);

function session(overrides: Partial<UploadSession> = {}): UploadSession {
  return {
    id: SESSION_ID,
    secretHash: createHash('sha256').update(SECRET).digest('hex'),
    userId: null,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function photo(overrides: Partial<StagedPhoto> = {}): StagedPhoto {
  return {
    id: PHOTO_ID,
    sessionId: SESSION_ID,
    kind: 'photo',
    status: 'uploading',
    contentType: 'image/jpeg',
    size: 1000,
    priority: STAGED_PRIORITY.anonymous,
    attempts: 0,
    lockedAt: null,
    cardId: null,
    url: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('UploadStagingService', () => {
  const sessions = {
    findWithSecret: jest.fn(),
    findExpired: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: object) => value),
  };
  const photos = {
    countBySession: jest.fn(),
    findInSession: jest.fn(),
    findPublishedInSession: jest.fn(),
    transition: jest.fn(),
    claimForCard: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: object) => value),
  };
  const staging = {
    createUploadTarget: jest.fn(),
    size: jest.fn(),
    read: jest.fn(),
    write: jest.fn(),
    remove: jest.fn(),
    removePrefix: jest.fn(),
  };
  const storage = { save: jest.fn() };
  const cardsService = {
    assertOwner: jest.fn(),
    removeUnreferencedPhotos: jest.fn(),
  };
  let service: UploadStagingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    photos.transition.mockResolvedValue(true);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UploadStagingService,
        { provide: UploadSessionRepository, useValue: sessions },
        { provide: StagedPhotoRepository, useValue: photos },
        { provide: STAGING_STORAGE, useValue: staging },
        { provide: STORAGE_PROVIDER, useValue: storage },
        { provide: CardsService, useValue: cardsService },
      ],
    }).compile();
    service = moduleRef.get(UploadStagingService);
  });

  describe('authenticate', () => {
    it('nhận token đúng', async () => {
      sessions.findWithSecret.mockResolvedValue(session());
      await expect(
        service.authenticate(`${SESSION_ID}.${SECRET}`),
      ).resolves.toMatchObject({ id: SESSION_ID });
    });

    it.each([
      ['thiếu token', undefined],
      ['sai định dạng', 'abc'],
      ['sai bí mật', `${SESSION_ID}.${'b'.repeat(43)}`],
    ])('từ chối khi %s', async (_label, token) => {
      sessions.findWithSecret.mockResolvedValue(session());
      await expect(service.authenticate(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('từ chối phiên đã hết hạn', async () => {
      sessions.findWithSecret.mockResolvedValue(
        session({ expiresAt: new Date(Date.now() - 1) }),
      );
      await expect(
        service.authenticate(`${SESSION_ID}.${SECRET}`),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('complete', () => {
    it('tệp không tới nơi thì đánh dấu hỏng', async () => {
      photos.findInSession.mockResolvedValue([photo()]);
      staging.size.mockResolvedValue(null);

      await service.complete(session(), [PHOTO_ID]);

      expect(photos.transition).toHaveBeenCalledWith(PHOTO_ID, ['uploading'], {
        status: 'failed',
        error: 'missing',
      });
    });

    // Presigned URL của R2 không chốt được dung lượng — đây là chỗ chốt.
    it('tệp quá cỡ bị xoá trước khi vào hàng đợi', async () => {
      photos.findInSession.mockResolvedValue([photo()]);
      staging.size.mockResolvedValue(MAX_UPLOAD_BYTES + 1);

      await service.complete(session(), [PHOTO_ID]);

      expect(staging.remove).toHaveBeenCalledWith(
        `raw/${SESSION_ID}/${PHOTO_ID}`,
      );
      expect(photos.transition).toHaveBeenCalledWith(PHOTO_ID, ['uploading'], {
        status: 'failed',
        error: 'too_large',
      });
    });

    it('người đã đăng nhập vào hàng ưu tiên cao hơn khách ẩn danh', async () => {
      photos.findInSession.mockResolvedValue([photo()]);
      staging.size.mockResolvedValue(500);

      await service.complete(session({ userId: 'user' }), [PHOTO_ID]);

      expect(photos.transition).toHaveBeenCalledWith(PHOTO_ID, ['uploading'], {
        status: 'queued',
        size: 500,
        priority: STAGED_PRIORITY.signedIn,
      });
    });
  });

  describe('claim', () => {
    it('chép tấm đã nén xong sang thư mục của thiệp', async () => {
      cardsService.assertOwner.mockResolvedValue({ id: CARD_ID });
      const ready = photo({ status: 'ready' });
      photos.findInSession
        .mockResolvedValueOnce([ready])
        .mockResolvedValueOnce([
          { ...ready, status: 'published', cardId: CARD_ID, url: '/u/a.avif' },
        ]);
      staging.read.mockResolvedValue(Buffer.from('avif'));
      storage.save.mockResolvedValue({ url: '/u/a.avif', key: 'k' });

      const views = await service.claim('user', session(), CARD_ID, [PHOTO_ID]);

      expect(storage.save).toHaveBeenCalledWith(
        expect.objectContaining({ folder: `cards/${CARD_ID}/photos` }),
      );
      expect(views).toEqual([
        { id: PHOTO_ID, status: 'published', url: '/u/a.avif' },
      ]);
    });

    // Một tấm chỉ thuộc về một thiệp: nhận lại cho thiệp khác thì hai thiệp
    // trỏ vào hai bản sao mà không ai biết.
    it('không nhận tấm đã thuộc thiệp khác', async () => {
      cardsService.assertOwner.mockResolvedValue({ id: CARD_ID });
      const other = photo({ status: 'ready', cardId: 'other' });
      photos.findInSession.mockResolvedValue([other]);

      const views = await service.claim('user', session(), CARD_ID, [PHOTO_ID]);

      expect(storage.save).not.toHaveBeenCalled();
      expect(views[0]).toMatchObject({ status: 'failed', error: 'other_card' });
    });
  });

  describe('remove', () => {
    it('tấm đã thuộc thiệp thì không xoá tệp', async () => {
      photos.findInSession.mockResolvedValue([photo({ status: 'published' })]);
      await service.remove(session(), PHOTO_ID);
      expect(staging.remove).not.toHaveBeenCalled();
    });

    it('tấm còn trong vùng tạm thì xoá cả bản thô lẫn bản đã nén', async () => {
      photos.findInSession.mockResolvedValue([photo({ status: 'ready' })]);
      await service.remove(session(), PHOTO_ID);
      expect(staging.remove).toHaveBeenCalledTimes(2);
    });
  });

  describe('readPreview', () => {
    it('trả bản đã nén của tấm đã xong', async () => {
      const buffer = Buffer.from('avif');
      photos.findInSession.mockResolvedValue([photo({ status: 'ready' })]);
      staging.read.mockResolvedValue(buffer);
      await expect(service.readPreview(session(), PHOTO_ID)).resolves.toBe(
        buffer,
      );
      expect(staging.read).toHaveBeenCalledWith(
        `ready/${SESSION_ID}/${PHOTO_ID}.avif`,
      );
    });

    it.each(['queued', 'processing'] as const)(
      'tấm còn %s thì báo 409 để editor hỏi lại',
      async (status) => {
        photos.findInSession.mockResolvedValue([photo({ status })]);
        await expect(
          service.readPreview(session(), PHOTO_ID),
        ).rejects.toMatchObject({
          response: { code: 'STAGED_PHOTO_PROCESSING' },
        });
        expect(staging.read).not.toHaveBeenCalled();
      },
    );

    it.each(['uploading', 'failed', 'published'] as const)(
      'tấm %s thì không có bản xem trước',
      async (status) => {
        photos.findInSession.mockResolvedValue([photo({ status })]);
        await expect(service.readPreview(session(), PHOTO_ID)).rejects.toThrow(
          NotFoundException,
        );
        expect(staging.read).not.toHaveBeenCalled();
      },
    );

    it('không đọc được ảnh của phiên khác', async () => {
      photos.findInSession.mockResolvedValue([]);
      await expect(service.readPreview(session(), PHOTO_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('bản tạm vừa bị xoá giữa chừng thì báo 404', async () => {
      photos.findInSession.mockResolvedValue([photo({ status: 'publishing' })]);
      staging.read.mockRejectedValue(new Error('NoSuchKey'));
      await expect(service.readPreview(session(), PHOTO_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('purgeExpired', () => {
    const OTHER_CARD_ID = '44444444-4444-4444-8444-444444444444';

    beforeEach(() => {
      sessions.findExpired.mockResolvedValue([session()]);
      cardsService.removeUnreferencedPhotos.mockResolvedValue(0);
    });

    it('gom ảnh đã nhận theo thiệp rồi mới xoá phiên', async () => {
      photos.findPublishedInSession.mockResolvedValue([
        photo({ status: 'published', cardId: CARD_ID, url: '/uploads/a.avif' }),
        photo({ status: 'published', cardId: CARD_ID, url: '/uploads/b.avif' }),
        photo({
          status: 'published',
          cardId: OTHER_CARD_ID,
          url: '/uploads/c.avif',
        }),
      ]);

      await expect(service.purgeExpired()).resolves.toBe(1);

      expect(cardsService.removeUnreferencedPhotos).toHaveBeenCalledWith(
        CARD_ID,
        ['/uploads/a.avif', '/uploads/b.avif'],
      );
      expect(cardsService.removeUnreferencedPhotos).toHaveBeenCalledWith(
        OTHER_CARD_ID,
        ['/uploads/c.avif'],
      );
      // Cascade xoá hàng `staged_photos` — phải đối chiếu xong trước đó.
      expect(
        cardsService.removeUnreferencedPhotos.mock.invocationCallOrder[1],
      ).toBeLessThan(sessions.delete.mock.invocationCallOrder[0]);
    });

    it('phiên không nhận ảnh nào về thiệp thì không đụng tới thiệp', async () => {
      photos.findPublishedInSession.mockResolvedValue([]);
      await service.purgeExpired();
      expect(cardsService.removeUnreferencedPhotos).not.toHaveBeenCalled();
      expect(staging.removePrefix).toHaveBeenCalled();
    });

    it('dọn ảnh thừa hỏng vẫn dọn tiếp tệp tạm và phiên', async () => {
      photos.findPublishedInSession.mockResolvedValue([
        photo({ status: 'published', cardId: CARD_ID, url: '/uploads/a.avif' }),
      ]);
      cardsService.removeUnreferencedPhotos.mockRejectedValue(new Error('db'));

      await service.purgeExpired();

      expect(staging.removePrefix).toHaveBeenCalled();
      expect(sessions.delete).toHaveBeenCalledWith({ id: SESSION_ID });
    });
  });
});
