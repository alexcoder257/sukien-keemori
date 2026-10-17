import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@constant/error-messages';
import sharp from 'sharp';
import type { PhotoSlotKey } from '@common/enums/invitation.enum';
import { isKeyInsideCard } from '@modules/storage/storage-keys';
import { STORAGE_PROVIDER } from '@modules/storage/storage.types';
import type { StorageProvider } from '@modules/storage/storage.types';
import type { StoredContent } from '@modules/cards/wedding-card.entity';
import type { SharePreviewDto } from '@modules/cards/dto/invitation-content.dto';

/** Chỉ sinh ảnh chia sẻ lúc chủ thiệp lưu; không sửa slug, khách hay ảnh gốc. */
@Injectable()
export class SharePreviewService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async prepare(
    cardId: string,
    slots: PhotoSlotKey[],
    content: StoredContent,
    previous?: SharePreviewDto,
  ): Promise<SharePreviewDto | undefined> {
    const requested = content.sharePreview;
    // Client cũ không biết trường mới: không vô tình xoá lựa chọn đã lưu.
    if (!requested) return previous;
    const settings: SharePreviewDto = {
      mode: requested.mode,
      photoUrl: requested.photoUrl,
      positionY: requested.positionY,
    };
    // Mặc định là ảnh Keemori. `auto` cũ từng nghĩa là "tự lấy ảnh bìa" và là
    // giá trị mọi thiệp mới được gán sẵn, nên không tách được ai thật sự chọn
    // ảnh bìa: giờ nó cũng là Keemori. Muốn ảnh riêng thì chủ thiệp chọn
    // (`photo`), kể cả khi đó chính là ảnh bìa.
    if (settings.mode !== 'photo') return settings;

    const owned = (url: string | undefined): url is string => {
      if (!url) return false;
      const key = this.storage.keyFromUrl(url);
      return key !== null && isKeyInsideCard(key, cardId);
    };
    const eligible = [
      ...slots.map((slot) => content.photos[slot]),
      ...content.album.photos,
    ].filter(owned);
    // Ảnh đã chọn bị xoá hoặc ảnh không còn thuộc thiệp: về ảnh Keemori.
    if (!eligible.includes(settings.photoUrl)) {
      return { mode: 'brand', photoUrl: '', positionY: 50 };
    }
    const source = settings.photoUrl;

    // Chỉ tái dùng URL do server đã lưu, không nhận URL JPEG từ client.
    if (
      previous?.sourceUrl === source &&
      previous.positionY === settings.positionY &&
      previous.imageUrl
    ) {
      return { ...settings, sourceUrl: source, imageUrl: previous.imageUrl };
    }

    const key = this.storage.keyFromUrl(source)!;
    const input = await this.storage.read(key);
    // Ảnh đã lưu được xoay đúng và bỏ EXIF từ bước upload. Cắt ở kích thước
    // gốc trước khi phóng: ảnh cực dọc không tạo bitmap trung gian khổng lồ.
    const { width, height } = await sharp(input).metadata();
    if (!width || !height) {
      throw new BadRequestException(ERROR_MESSAGES.STORAGE.INVALID_IMAGE);
    }
    const cropWidth = Math.min(
      width,
      Math.max(1, Math.round((height * 1200) / 630)),
    );
    const cropHeight = Math.min(
      height,
      Math.max(1, Math.round((width * 630) / 1200)),
    );
    const buffer = await sharp(input, { limitInputPixels: 120_000_000 })
      .extract({
        left: Math.round((width - cropWidth) / 2),
        top: Math.round(((height - cropHeight) * settings.positionY) / 100),
        width: cropWidth,
        height: cropHeight,
      })
      .resize(1200, 630, { fit: 'fill' })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    const stored = await this.storage.save({
      buffer,
      originalName: 'share-preview.jpg',
      mimeType: 'image/jpeg',
      size: buffer.length,
      folder: `cards/${cardId}/share`,
    });
    // Giữ các phiên bản JPEG cũ cho preview đã gửi. Xoá thiệp vẫn dọn cả folder.
    return { ...settings, sourceUrl: source, imageUrl: stored.url };
  }
}
