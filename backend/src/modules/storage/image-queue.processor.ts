import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import type { StagedPhoto } from './staged-photo.entity';
import { STAGING_STORAGE, stagingKeys } from './staging.types';
import type { StagingStorage } from './staging.types';
import { MAX_PROCESS_ATTEMPTS, STALE_PROCESSING_MS } from './storage.constants';
import { StagedPhotoRepository } from './upload-staging.repository';

/** Hết việc thì nghỉ bấy lâu rồi hỏi lại database. */
const IDLE_DELAY_MS = 1000;

/**
 * Worker nén ảnh: rút từng tấm khỏi hàng đợi `staged_photos`, giải mã + nén
 * AVIF, cất bản đã nén vào `ready/` của vùng tạm.
 *
 * Chạy **trong một process riêng** (`src/image-worker.ts`, do
 * `ImageWorkerHost` sinh ra), không chạy trong process API. Hai lý do:
 *
 * 1. Nén AVIF là việc ăn CPU, mà VPS chỉ có 2 lõi chia cho cả API, trang khách,
 *    CMS và Postgres. Process riêng được hạ độ ưu tiên CPU (`nice`), nên
 *    lúc tải cao API vẫn được phục vụ trước.
 * 2. `sharp` giải nén một ảnh lớn ra hàng trăm MB bitmap. Hết RAM thì hệ điều
 *    hành giết process to nhất — giờ đó là worker, không phải API, và
 *    `ImageWorkerHost` dựng lại nó.
 *
 * Chỉ **một** tấm một lúc, và `sharp` bị giới hạn một luồng: trần cố định bất
 * kể có bao nhiêu khách đang tải lên. Tải cao thì hàng đợi dài ra chứ server
 * không sập; ảnh của thiệp đang được lưu được nâng lên đầu hàng
 * (`STAGED_PRIORITY.claiming`).
 *
 * Worker **không** chép ảnh sang kho công khai — việc đó cần biết thiệp và quyền
 * sở hữu, và nằm ở `UploadStagingService.claim`.
 */
@Injectable()
export class ImageQueueProcessor {
  private readonly logger = new Logger(ImageQueueProcessor.name);
  private stopped = false;

  constructor(
    private readonly photos: StagedPhotoRepository,
    @Inject(STAGING_STORAGE)
    private readonly staging: StagingStorage,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Worker nén ảnh đã chạy');
    while (!this.stopped) {
      const worked = await this.processNext().catch((error: unknown) => {
        // Lỗi ở đây là lỗi hạ tầng (mất kết nối database), không phải lỗi của
        // một tấm ảnh — nghỉ rồi thử lại thay vì để process chết.
        this.logger.error(
          `Vòng xử lý hàng đợi ảnh hỏng: ${(error as Error).message}`,
        );
        return false;
      });
      if (!worked) await sleep(IDLE_DELAY_MS);
    }
  }

  stop(): void {
    this.stopped = true;
  }

  /** Trả `true` nếu đã rút được một việc (kể cả việc hỏng). */
  async processNext(): Promise<boolean> {
    const row = await this.photos.takeNext(
      new Date(Date.now() - STALE_PROCESSING_MS),
    );
    if (!row) return false;
    await this.process(row);
    return true;
  }

  private async process(row: StagedPhoto): Promise<void> {
    const rawKey = stagingKeys.raw(row.sessionId, row.id);
    const readyKey = stagingKeys.ready(row.sessionId, row.id);

    let raw: Buffer;
    try {
      raw = await this.staging.read(rawKey);
    } catch {
      await this.photos.transition(row.id, ['processing'], {
        status: 'failed',
        error: 'missing',
        lockedAt: null,
      });
      return;
    }

    try {
      const image = await this.imageProcessor.toAvif(raw, `${row.id}.img`);
      await this.staging.write(readyKey, image.buffer, image.mimeType);
      const stored = await this.photos.transition(row.id, ['processing'], {
        status: 'ready',
        size: image.size,
        lockedAt: null,
      });
      // Người dùng gỡ tấm này trong lúc đang nén: hàng đã biến mất, bản vừa nén
      // không còn ai nhận.
      if (!stored) await this.staging.remove(readyKey);
      await this.staging.remove(rawKey);
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Không phải ảnh thật (hoặc quá nhiều điểm ảnh): thử lại cũng vậy.
        await this.staging.remove(rawKey);
        await this.photos.transition(row.id, ['processing'], {
          status: 'failed',
          error: 'invalid_image',
          lockedAt: null,
        });
        return;
      }
      this.logger.warn(
        `Nén ảnh ${row.id} hỏng (lần ${row.attempts}): ${(error as Error).message}`,
      );
      const exhausted = row.attempts >= MAX_PROCESS_ATTEMPTS;
      if (exhausted) await this.staging.remove(rawKey);
      await this.photos.transition(
        row.id,
        ['processing'],
        exhausted
          ? { status: 'failed', error: 'processing_failed', lockedAt: null }
          : { status: 'queued', lockedAt: null },
      );
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
