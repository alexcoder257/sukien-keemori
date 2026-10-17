import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SettingsService } from './settings.service';
import type { SettingsRepository } from './settings.repository';
import type { RevalidateService } from '@common/revalidate/revalidate.service';
import type { SiteSettings } from './site-settings.entity';

function makeService(row: Partial<SiteSettings> = { messengerUrl: null }) {
  const findOrCreate = jest.fn(() => Promise.resolve(row as SiteSettings));
  const save = jest.fn((entity: SiteSettings) => Promise.resolve(entity));
  const ping = jest.fn();
  const service = new SettingsService(
    { findOrCreate, save } as unknown as SettingsRepository,
    { ping } as unknown as RevalidateService,
  );
  return { service, findOrCreate, ping };
}

describe('SettingsService — cấu hình công khai', () => {
  it('trả kênh mạng xã hội của chân trang nhưng không lộ cột riêng tư', async () => {
    const { service } = makeService({
      messengerUrl: null,
      facebookUrl: 'https://facebook.com/keemori',
      instagramUrl: null,
      tiktokUrl: 'https://tiktok.com/@keemori',
      zaloPhone: '0912345678',
      contactEmail: 'hotro@keemori.com',
      demoCardSlug: 'an-binh-1a2b',
    });

    const settings = await service.findPublic();

    expect(settings).toMatchObject({
      facebookUrl: 'https://facebook.com/keemori',
      instagramUrl: null,
      tiktokUrl: 'https://tiktok.com/@keemori',
      zaloPhone: '0912345678',
      contactEmail: 'hotro@keemori.com',
    });
    expect(settings).not.toHaveProperty('homepageTemplateCount');
  });
});

describe('SettingsService — bản nhớ cấu hình', () => {
  it('chỉ đọc database một lần dù gọi nhiều lượt', async () => {
    const { service, findOrCreate } = makeService();

    await service.find();
    await service.find();
    await service.findPublic();

    // Đây là lý do tồn tại của bản nhớ: `find()` nằm trên đường xem thiệp chưa
    // thanh toán, còn `findPublic()` chạy trên mọi trang khách.
    expect(findOrCreate).toHaveBeenCalledTimes(1);
  });

  it('lưu cấu hình xong thì lượt đọc kế tiếp thấy giá trị mới ngay', async () => {
    const { service } = makeService({ messengerUrl: null });

    await service.find();
    await service.update({ messengerUrl: 'https://m.me/moi' });

    // Không có TTL nào để chờ: `update` là đường duy nhất sửa được hàng này nên
    // nó thay bản nhớ ngay tại chỗ.
    await expect(service.findPublic()).resolves.toEqual({
      messengerUrl: 'https://m.me/moi',
    });
  });

  it('báo frontend xoá cache theo tag sau khi lưu', async () => {
    const { service, ping } = makeService();

    await service.update({ messengerUrl: 'https://m.me/moi' });

    expect(ping).toHaveBeenCalledWith(['site-settings']);
  });
});

describe('SettingsService — cập nhật từng phần', () => {
  it('lưu một trường không xoá các trường khác trong bản nhớ', async () => {
    const { service } = makeService({
      demoCardSlug: 'an-binh-1a2b',
      demoCardKind: 'card',
      homepageTemplateCount: 6,
      messengerUrl: 'https://m.me/keemori',
    });

    // Dựng DTO bằng `new` như ValidationPipe: mọi field chưa gửi vẫn có mặt
    // dưới dạng `undefined`.
    const dto = Object.assign(new UpdateSiteSettingsDto(), {
      homepageTemplateCount: 9,
    });
    await service.update(dto);
    const settings = await service.find();

    expect(settings).toMatchObject({
      demoCardSlug: 'an-binh-1a2b',
      demoCardKind: 'card',
      homepageTemplateCount: 9,
      messengerUrl: 'https://m.me/keemori',
    });
  });
});
