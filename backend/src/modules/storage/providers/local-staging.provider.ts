import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StagingStorage, StagingUploadTarget } from '../staging.types';

/** Luồng gửi lên vượt trần dung lượng — bên gọi đổi thành lỗi 413/400. */
export class StagingTooLargeError extends Error {}

/**
 * Vùng tạm trên đĩa, cho dev và cho môi trường chưa cấu hình R2.
 *
 * Thư mục **nằm ngoài** `UPLOAD_DIR`: thư mục kia được `main.ts` serve công
 * khai, còn byte ở đây chưa ai kiểm. Trình duyệt không có presigned URL nào để
 * gửi thẳng lên đĩa, nên đích tải lên là một route của chính backend
 * (`PUT /upload-sessions/photos/:id/raw`), stream thẳng xuống tệp chứ không giữ
 * cả ảnh trong RAM như Multer.
 *
 * Không phải volume trong Docker, và đó là chủ ý: đây là tệp tạm. Deploy giữa
 * chừng làm mất tệp thì lượt nhận ảnh báo `missing` và editor gửi lại tấm đó
 * từ bản còn trong trình duyệt.
 */
@Injectable()
export class LocalStagingStorage implements StagingStorage {
  private readonly logger = new Logger(LocalStagingStorage.name);
  private readonly rootDir: string;

  constructor(configService: ConfigService) {
    this.rootDir =
      configService.get<string>('UPLOAD_STAGING_DIR') ?? 'uploads-staging';
  }

  createUploadTarget({
    photoId,
    contentType,
  }: {
    photoId: string;
    contentType: string;
  }): Promise<StagingUploadTarget> {
    return Promise.resolve({
      url: `/upload-sessions/photos/${photoId}/raw`,
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    });
  }

  /**
   * Ghi luồng request xuống đĩa, cắt ngang khi vượt `maxBytes`. Không đọc
   * `Content-Length` rồi tin: header đó do client gửi.
   */
  async writeStream(
    key: string,
    source: NodeJS.ReadableStream,
    maxBytes: number,
  ): Promise<number> {
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true });
    let received = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        received += chunk.length;
        if (received > maxBytes) {
          callback(new StagingTooLargeError());
          return;
        }
        callback(null, chunk);
      },
    });
    try {
      await pipeline(source, limit, createWriteStream(path));
      return received;
    } catch (error) {
      await unlink(path).catch(() => undefined);
      throw error;
    }
  }

  async size(key: string): Promise<number | null> {
    try {
      return (await stat(this.path(key))).size;
    } catch {
      return null;
    }
  }

  read(key: string): Promise<Buffer> {
    return readFile(this.path(key));
  }

  async write(key: string, buffer: Buffer): Promise<void> {
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer);
  }

  async remove(key: string): Promise<void> {
    await unlink(this.path(key)).catch(() => undefined);
  }

  async removePrefix(prefix: string): Promise<void> {
    try {
      await rm(this.path(prefix), { recursive: true, force: true });
    } catch {
      this.logger.warn(`Không xoá được thư mục tạm: ${prefix}`);
    }
  }

  /**
   * Khoá do chính backend dựng (`stagingKeys`) từ uuid, nhưng vẫn chặn `..`:
   * một lỗi ở chỗ dựng khoá không được biến thành đường ghi ra ngoài thư mục.
   */
  private path(key: string): string {
    if (key.includes('..')) throw new Error(`Khoá tạm không hợp lệ: ${key}`);
    return join(this.rootDir, key);
  }
}
