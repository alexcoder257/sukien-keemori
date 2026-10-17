import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider, StoredFile, UploadFileInput } from '../storage.types';

/**
 * Lưu ảnh lên **Cloudflare R2**. R2 nói giao thức S3 nên dùng thẳng
 * `@aws-sdk/client-s3`, chỉ khác `endpoint` và `region: 'auto'`.
 *
 * Lý do chọn R2 thay vì S3: **băng thông ra miễn phí**. Website này chủ yếu là
 * ảnh nên chi phí gần như nằm trọn ở egress — thứ R2 tính $0 còn S3 tính theo
 * GB. Lưu trữ vẫn tính tiền ($0.015/GB-tháng), tức ảnh không ai xem vẫn tốn.
 *
 * **Trả về đường dẫn tương đối `/uploads/...`, không phải URL tuyệt đối của R2.**
 * Hai lý do, cả hai đều đổi hành vi nếu làm khác:
 *
 * 1. `content.photos.*` được dùng thẳng làm `src` trong khoảng 30 file template.
 *    URL tuyệt đối thì hoặc phải sửa cả 30 file, hoặc phải backfill dữ liệu đã
 *    ghi mỗi lần đổi tên miền.
 * 2. Khoá trên R2 mang đúng tiền tố của đường dẫn công khai, nên khoá và URL
 *    trùng khít — không cần bảng ánh xạ nào giữa hai bên.
 *
 * Việc `/uploads/*` trỏ về đâu là chuyện của hạ tầng (rewrite ở `next.config.ts`
 * hoặc route ở Cloudflare), không phải của backend.
 */
@Injectable()
export class R2Provider implements StorageProvider {
  private readonly logger = new Logger(R2Provider.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  /** Ví dụ `/uploads` — dùng chung với `LocalDiskProvider`. */
  private readonly publicPath: string;
  /** Ví dụ `uploads` — chính `publicPath` bỏ dấu `/`, nên khoá khớp URL. */
  private readonly keyPrefix: string;

  constructor(configService: ConfigService) {
    const accountId = configService.getOrThrow<string>('R2_ACCOUNT_ID');
    this.bucket = configService.getOrThrow<string>('R2_BUCKET');

    this.publicPath = (
      configService.get<string>('UPLOAD_PUBLIC_PATH') ?? '/uploads'
    ).replace(/\/+$/, '');
    this.keyPrefix = this.publicPath.replace(/^\/+/, '');

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

  async save(input: UploadFileInput): Promise<StoredFile> {
    // Cùng luật đặt tên với `LocalDiskProvider`: tên do client đặt có thể chứa
    // `../` hoặc ký tự lạ, và hai khách tải lên cùng tên sẽ đè nhau.
    const fileName = `${Date.now()}-${randomBytes(6).toString('hex')}${extname(
      input.originalName,
    ).toLowerCase()}`;
    const key = `${this.keyPrefix}/${input.folder}/${fileName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        /**
         * Cache vĩnh viễn, và đây là phần **bắt buộc** chứ không phải tối ưu:
         * thiếu header này Cloudflare vẫn cache nhưng TTL mặc định chỉ 120
         * phút, tức cứ 2 tiếng mỗi POP lại hỏi R2 một lần và phát sinh request
         * tính tiền. Đặt vĩnh viễn được vì tên tệp là ngẫu nhiên: cùng một tên
         * thì nội dung không bao giờ đổi.
         */
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      url: `${this.publicPath}/${input.folder}/${fileName}`,
      key,
      size: input.size,
      mimeType: input.mimeType,
    };
  }

  async remove(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch {
      // Giống `LocalDiskProvider`: xoá phải idempotent, không được làm hỏng một
      // thao tác nghiệp vụ chỉ vì tệp không còn ở đó.
      this.logger.warn(`Không xoá được tệp trên R2 (có thể đã xoá): ${key}`);
    }
  }

  async read(key: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!result.Body) throw new Error('Stored image has no body');
    return Buffer.from(await result.Body.transformToByteArray());
  }

  keyFromUrl(url: string): string | null {
    const prefix = `${this.publicPath}/`;
    if (!url.startsWith(prefix)) return null;
    // Khoá mang đúng tiền tố của đường dẫn công khai, nên chỉ việc bỏ `/` đầu.
    return `${this.keyPrefix}/${url.slice(prefix.length)}`;
  }

  /**
   * S3 không có thư mục, nên xoá "thư mục" là liệt kê theo tiền tố rồi xoá
   * theo lô. Phải lặp theo `ContinuationToken`: một lần liệt kê trả tối đa
   * 1000 khoá, và album của gói Diamond cộng ảnh các ô có thể vượt con số đó
   * nếu chủ thiệp thay ảnh nhiều lần.
   */
  async removeFolder(folder: string): Promise<void> {
    const prefix = `${this.keyPrefix}/${folder}/`;
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
      this.logger.warn(`Không xoá được thư mục ảnh trên R2: ${prefix}`);
    }
  }
}
