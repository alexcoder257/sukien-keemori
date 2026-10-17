import sharp from 'sharp';
import { SharePreviewService } from '@modules/cards/share-preview.service';
import type { StoredContent } from '@modules/cards/wedding-card.entity';
import type {
  StorageProvider,
  StoredFile,
  UploadFileInput,
} from '@modules/storage/storage.types';

const cardId = '11111111-1111-4111-8111-111111111111';
const cover = `/uploads/cards/${cardId}/photos/cover.avif`;
const album = `/uploads/cards/${cardId}/album/one.avif`;

function setup() {
  const read = jest.fn<Promise<Buffer>, [string]>();
  const save = jest
    .fn<Promise<StoredFile>, [UploadFileInput]>()
    .mockResolvedValue({
      url: `/uploads/cards/${cardId}/share/new.jpg`,
      key: `cards/${cardId}/share/new.jpg`,
      mimeType: 'image/jpeg',
      size: 1024,
    });
  const storage = {
    keyFromUrl: (url: string) =>
      url.startsWith('/uploads/') ? url.slice(9) : null,
    read,
    save,
  } as unknown as StorageProvider;
  return { service: new SharePreviewService(storage), read, save };
}
function content(overrides: Partial<StoredContent> = {}): StoredContent {
  return {
    photos: { cover },
    album: { photos: [album] },
    sharePreview: { mode: 'photo', photoUrl: cover, positionY: 50 },
    ...overrides,
  } as StoredContent;
}

describe('SharePreviewService', () => {
  it('thiệp cũ không có lựa chọn giữ mặc định, không đọc hay sinh ảnh', async () => {
    const { service, read, save } = setup();
    expect(
      await service.prepare(
        cardId,
        ['cover'],
        content({ sharePreview: undefined }),
      ),
    ).toBeUndefined();
    expect(read).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('không đọc ảnh thiệp khác, đường dẫn đi ngược hoặc ảnh demo', async () => {
    for (const url of [
      '/uploads/cards/another-card/photos/photo.avif',
      `/uploads/cards/${cardId}/photos/../private.avif`,
      '/images/templates/demo/photos/cover.avif',
      'https://example.com/private.jpg',
    ]) {
      const { service, read, save } = setup();
      const result = await service.prepare(
        cardId,
        ['cover'],
        content({
          photos: { cover: url },
          album: { photos: [url] },
          sharePreview: { mode: 'photo', photoUrl: url, positionY: 50 },
        }),
      );
      expect(result?.imageUrl).toBeUndefined();
      expect(read).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    }
  });

  it('sinh JPEG 1200x630 đúng vị trí cắt ảnh dọc, không sửa ảnh gốc', async () => {
    const { service, read, save } = setup();
    const original = await sharp({
      create: { width: 1200, height: 1260, channels: 3, background: '#ff0000' },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 1200,
              height: 630,
              channels: 3,
              background: '#0000ff',
            },
          })
            .png()
            .toBuffer(),
          top: 630,
          left: 0,
        },
      ])
      .png()
      .toBuffer();
    read.mockResolvedValue(original);
    const next = content({
      sharePreview: { mode: 'photo', photoUrl: cover, positionY: 100 },
    });
    const result = await service.prepare(cardId, ['cover'], next);
    expect(next.photos.cover).toBe(cover);
    expect(result?.sourceUrl).toBe(cover);
    expect(read).toHaveBeenCalledWith(`cards/${cardId}/photos/cover.avif`);
    const input = save.mock.calls[0][0] as {
      buffer: Buffer;
      folder: string;
      mimeType: string;
    };
    expect(input.folder).toBe(`cards/${cardId}/share`);
    expect(input.mimeType).toBe('image/jpeg');
    const metadata = await sharp(input.buffer).metadata();
    expect(metadata).toMatchObject({
      width: 1200,
      height: 630,
      format: 'jpeg',
    });
    const { data } = await sharp(input.buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(data[2]).toBeGreaterThan(240);
    expect(data[0]).toBeLessThan(10);
    expect(metadata.exif).toBeUndefined();
  });

  it('chọn ảnh album và tái dùng JPEG của server cho cùng ảnh/cách cắt', async () => {
    const { service, read, save } = setup();
    const previous = {
      mode: 'photo' as const,
      photoUrl: album,
      positionY: 50,
      sourceUrl: album,
      imageUrl: `/uploads/cards/${cardId}/share/old.jpg`,
    };
    const result = await service.prepare(
      cardId,
      ['cover'],
      content({ sharePreview: { ...previous, imageUrl: '/forged.jpg' } }),
      previous,
    );
    expect(result?.imageUrl).toBe(previous.imageUrl);
    expect(read).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('ảnh cực dọc vẫn tạo JPEG hữu hạn, cắt trước khi phóng lên', async () => {
    const { service, read, save } = setup();
    read.mockResolvedValue(
      await sharp({
        create: {
          width: 2,
          height: 2048,
          channels: 3,
          background: '#ffffff',
        },
      })
        .png()
        .toBuffer(),
    );
    await service.prepare(cardId, ['cover'], content());
    const metadata = await sharp(save.mock.calls[0][0].buffer).metadata();
    expect(metadata).toMatchObject({
      width: 1200,
      height: 630,
      format: 'jpeg',
    });
  });

  it('mặc định và `auto` cũ dùng ảnh Keemori, không tự lấy ảnh bìa', async () => {
    for (const mode of ['auto', 'brand'] as const) {
      const { service, read, save } = setup();
      const result = await service.prepare(
        cardId,
        ['cover'],
        content({ sharePreview: { mode, photoUrl: '', positionY: 50 } }),
      );
      expect(result).toEqual({ mode, photoUrl: '', positionY: 50 });
      expect(read).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    }
  });

  it('ảnh đã chọn không còn trong thiệp thì trở về ảnh Keemori', async () => {
    const { service, read, save } = setup();
    const result = await service.prepare(
      cardId,
      ['cover'],
      content({
        album: { photos: [] },
        sharePreview: { mode: 'photo', photoUrl: album, positionY: 0 },
      }),
    );
    expect(result).toEqual({ mode: 'brand', photoUrl: '', positionY: 50 });
    expect(read).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
