import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider, StoredFile, UploadFileInput } from '../storage.types';

/**
 * Lưu ảnh xuống đĩa của chính server và serve lại qua `/uploads` (khai trong
 * `main.ts`). Đủ để chạy dev và bản đầu tiên; khi cần CDN thì viết thêm một
 * provider khác và đổi binding trong `StorageModule`, không ai gọi tới đây phải
 * sửa.
 *
 * Giới hạn cần biết trước khi lên production: tệp nằm trên đĩa của một máy nên
 * không scale ngang được, và deploy kiểu container ephemeral sẽ mất tệp nếu
 * `UPLOAD_DIR` không phải volume gắn ngoài.
 */
@Injectable()
export class LocalDiskProvider implements StorageProvider {
  private readonly logger = new Logger(LocalDiskProvider.name);
  private readonly rootDir: string;
  private readonly publicPath: string;

  constructor(configService: ConfigService) {
    this.rootDir = configService.get<string>('UPLOAD_DIR') ?? 'uploads';
    this.publicPath =
      configService.get<string>('UPLOAD_PUBLIC_PATH') ?? '/uploads';
  }

  async save(input: UploadFileInput): Promise<StoredFile> {
    const directory = join(this.rootDir, input.folder);
    await mkdir(directory, { recursive: true });

    // Tên ngẫu nhiên chứ không giữ tên gốc: tên do client đặt có thể chứa `../`
    // hoặc ký tự lạ, và hai khách tải lên cùng tên sẽ đè nhau.
    const fileName = `${Date.now()}-${randomBytes(6).toString('hex')}${extname(
      input.originalName,
    ).toLowerCase()}`;
    const key = join(input.folder, fileName);

    await writeFile(join(this.rootDir, key), input.buffer);
    return {
      // Luôn dùng `/` trong URL kể cả khi `path.join` sinh `\` trên Windows.
      url: `${this.publicPath}/${key.split(/[\\/]/).join('/')}`,
      key,
      size: input.size,
      mimeType: input.mimeType,
    };
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(join(this.rootDir, key));
    } catch {
      // Tệp đã biến mất thì coi như xong: xoá phải idempotent, không được làm
      // hỏng một thao tác nghiệp vụ chỉ vì tệp không còn ở đó.
      this.logger.warn(`Không xoá được tệp (có thể đã bị xoá): ${key}`);
    }
  }

  read(key: string): Promise<Buffer> {
    return readFile(join(this.rootDir, key));
  }

  keyFromUrl(url: string): string | null {
    const prefix = `${this.publicPath.replace(/\/+$/, '')}/`;
    if (!url.startsWith(prefix)) return null;
    return url.slice(prefix.length);
  }

  async removeFolder(folder: string): Promise<void> {
    try {
      await rm(join(this.rootDir, folder), { recursive: true, force: true });
    } catch {
      this.logger.warn(`Không xoá được thư mục ảnh: ${folder}`);
    }
  }
}
