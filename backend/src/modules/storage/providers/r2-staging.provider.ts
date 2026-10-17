import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UPLOAD_URL_TTL_SECONDS } from '../storage.constants';
import type { StagingStorage, StagingUploadTarget } from '../staging.types';

/**
 * Vùng tạm trên R2: bucket `R2_STAGING_BUCKET`, **không** gắn custom domain và
 * không bật public access — xem lý do ở `staging.types.ts`.
 *
 * Bucket này cần hai cấu hình ngoài code (xem `ops/r2/README.md`): CORS cho
 * lệnh `PUT` từ trình duyệt, và lifecycle rule tự xoá sau 1 ngày làm lưới an
 * toàn cho những phiên cron chưa kịp dọn.
 *
 * Presigned URL **không chốt được dung lượng**: R2 không hỗ trợ presigned
 * `POST` (nơi S3 đặt `content-length-range`). Trần dung lượng vì vậy được kiểm
 * ở bước client báo "đã tải xong" (`UploadStagingService.complete`) — tệp quá
 * cỡ bị xoá trước khi chạm tới bước giải mã.
 */
export class R2StagingStorage implements StagingStorage {
  private readonly logger = new Logger(R2StagingStorage.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    const accountId = configService.getOrThrow<string>('R2_ACCOUNT_ID');
    this.bucket = configService.getOrThrow<string>('R2_STAGING_BUCKET');
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async createUploadTarget({
    key,
    contentType,
  }: {
    key: string;
    contentType: string;
  }): Promise<StagingUploadTarget> {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );
    return { url, method: 'PUT', headers: { 'Content-Type': contentType } };
  }

  async size(key: string): Promise<number | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return head.ContentLength ?? 0;
    } catch {
      return null;
    }
  }

  async read(key: string): Promise<Buffer> {
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!object.Body) throw new Error(`Tệp tạm rỗng: ${key}`);
    return Buffer.from(await object.Body.transformToByteArray());
  }

  async write(key: string, buffer: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  async remove(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch {
      this.logger.warn(`Không xoá được tệp tạm trên R2: ${key}`);
    }
  }

  async removePrefix(prefix: string): Promise<void> {
    try {
      let continuationToken: string | undefined;
      do {
        const listed = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );
        const keys = (listed.Contents ?? [])
          .map((object) => object.Key)
          .filter((key): key is string => Boolean(key));
        if (keys.length) {
          await this.client.send(
            new DeleteObjectsCommand({
              Bucket: this.bucket,
              Delete: { Objects: keys.map((Key) => ({ Key })) },
            }),
          );
        }
        continuationToken = listed.IsTruncated
          ? listed.NextContinuationToken
          : undefined;
      } while (continuationToken);
    } catch {
      // Lifecycle rule của bucket vẫn dọn nốt; không đáng làm hỏng cron.
      this.logger.warn(`Không xoá được thư mục tạm trên R2: ${prefix}`);
    }
  }
}
