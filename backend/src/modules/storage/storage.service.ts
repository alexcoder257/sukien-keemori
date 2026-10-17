import { ERROR_MESSAGES } from '@constant/error-messages';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from './storage.constants';
import { STORAGE_PROVIDER } from './storage.types';
import type { StorageProvider, StoredFile } from './storage.types';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: StorageProvider,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  /**
   * Ảnh của ô trưng bày trang chủ (ảnh bìa + ảnh chụp dài). Admin tải vào kho chung
   * (không thuộc thiệp nào); cách nén xem `toShowcaseAvif`.
   */
  async uploadShowcaseImage(file: Express.Multer.File): Promise<StoredFile> {
    this.assertValidImage(file);
    const image = await this.imageProcessor.toShowcaseAvif(
      file.buffer,
      file.originalname,
    );
    return this.provider.save({
      buffer: image.buffer,
      originalName: image.fileName,
      mimeType: image.mimeType,
      size: image.size,
      folder: 'showcase',
    });
  }

  private assertValidImage(file: Express.Multer.File | undefined): void {
    if (!file) {
      throw new BadRequestException(ERROR_MESSAGES.STORAGE.FILE_REQUIRED);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(ERROR_MESSAGES.STORAGE.UNSUPPORTED_TYPE);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(ERROR_MESSAGES.STORAGE.TOO_LARGE);
    }
  }
}
