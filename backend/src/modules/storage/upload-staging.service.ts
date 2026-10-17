import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ERROR_CODES } from '@constant/error-codes';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { CardsService } from '@modules/cards/cards.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestUploadItemDto } from './dto/upload-session.dto';
import {
  LocalStagingStorage,
  StagingTooLargeError,
} from './providers/local-staging.provider';
import type { StagedPhoto } from './staged-photo.entity';
import { STAGING_STORAGE, stagingKeys } from './staging.types';
import type { StagingStorage, StagingUploadTarget } from './staging.types';
import {
  MAX_PHOTOS_PER_SESSION,
  MAX_UPLOAD_BYTES,
  STAGED_PRIORITY,
  UPLOAD_SESSION_TTL_MS,
} from './storage.constants';
import { STORAGE_PROVIDER } from './storage.types';
import type { StorageProvider } from './storage.types';
import type { UploadSession } from './upload-session.entity';
import {
  StagedPhotoRepository,
  UploadSessionRepository,
} from './upload-staging.repository';

/**
 * Trạng thái một tấm ảnh **như editor cần biết**. Gộp mọi bước giữa
 * (`queued`/`processing`/`ready`/`publishing`) thành `processing`: editor chỉ
 * phải quyết định đợi tiếp, dùng URL, hay gửi lại.
 */
export interface StagedPhotoView {
  id: string;
  status: 'uploading' | 'processing' | 'published' | 'failed';
  /** Chỉ có khi `published`. */
  url?: string;
  /** Mã lỗi máy đọc khi `failed`. */
  error?: string;
}

export interface CreatedUploadSession {
  /** `<id>.<secret>` — client gửi lại qua header `X-Upload-Session`. */
  token: string;
  expiresAt: Date;
}

/** Tấm `publishing` quá lâu nghĩa là lượt chép trước chết giữa chừng. */
const STALE_PUBLISHING_MS = 2 * 60 * 1000;

const SESSION_TOKEN_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/;

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/**
 * Đường ảnh của editor: **gửi lên vùng tạm ngay lúc chọn**, kể cả khi chưa đăng
 * nhập, rồi **nhận về thiệp** lúc bấm Lưu.
 *
 * Trước đây ảnh chỉ được gửi khi đã đăng nhập, và gửi qua chính backend. Hai
 * hệ quả, cả hai đều là lý do đổi:
 *
 * 1. Khách soạn thiệp khi chưa đăng nhập dồn cả album lại; đăng nhập xong là
 *    cả chục MB đổ lên cùng lúc — đúng khoảng chờ mà việc tải sớm sinh ra để
 *    tránh. Giờ mọi tấm lên vùng tạm ngay, đăng nhập xong không còn gì phải gửi.
 * 2. Mọi byte đi qua VPS 2 lõi và nằm cả trong RAM (Multer `memoryStorage`),
 *    bước nén AVIF chạy ngay trong request. Vài chục khách cùng lúc là đủ làm
 *    backend bị hệ điều hành giết vì hết RAM. Giờ byte đi thẳng lên R2
 *    (presigned URL), còn nén chạy ở một process riêng với trần cố định
 *    (`ImageQueueProcessor`).
 *
 * Luật an ninh thay cho "ảnh luôn thuộc một thiệp có chủ": ảnh trong vùng tạm
 * **không có URL công khai nào**, và chỉ thành ảnh công khai khi (a) đã được
 * giải mã thành ảnh thật và nén lại, **và** (b) một tài khoản đã đăng nhập nhận
 * nó về thiệp của chính mình. Không ai nhận thì phiên hết hạn sau một ngày và bị
 * dọn (`UploadStagingPurgeCron`, cộng lifecycle rule của bucket tạm).
 */
@Injectable()
export class UploadStagingService {
  private readonly logger = new Logger(UploadStagingService.name);

  constructor(
    private readonly sessions: UploadSessionRepository,
    private readonly photos: StagedPhotoRepository,
    @Inject(STAGING_STORAGE)
    private readonly staging: StagingStorage,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: StorageProvider,
    private readonly cardsService: CardsService,
  ) {}

  async createSession(userId?: string): Promise<CreatedUploadSession> {
    const secret = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_MS);
    const session = await this.sessions.save(
      this.sessions.create({
        secretHash: hashSecret(secret),
        userId: userId ?? null,
        expiresAt,
      }),
    );
    return { token: `${session.id}.${secret}`, expiresAt };
  }

  /**
   * Token sai, hết hạn hay phiên đã bị dọn đều trả **cùng một lỗi 401**: editor
   * chỉ có một cách xử lý — mở phiên mới và gửi lại những tấm chưa xong.
   */
  async authenticate(token: string | undefined): Promise<UploadSession> {
    const match = token ? SESSION_TOKEN_PATTERN.exec(token) : null;
    if (!match) throw this.invalidSession();
    const [, id, secret] = match;

    const session = await this.sessions.findWithSecret(id);
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw this.invalidSession();
    }
    const expected = Buffer.from(session.secretHash, 'hex');
    const actual = Buffer.from(hashSecret(secret), 'hex');
    if (!timingSafeEqual(expected, actual)) throw this.invalidSession();
    return session;
  }

  /**
   * Cấp chỗ gửi cho cả lô ảnh vừa chọn. Một request cho cả lô chứ không phải
   * một request mỗi tấm: 30 ảnh album mà mỗi tấm hai request (xin URL + báo
   * xong) là chạm ngay trần 60 request/phút mặc định của một IP.
   */
  async requestUploads(
    session: UploadSession,
    items: RequestUploadItemDto[],
    userId?: string,
  ): Promise<{ id: string; upload: StagingUploadTarget }[]> {
    const existing = await this.photos.countBySession(session.id);
    if (existing + items.length > MAX_PHOTOS_PER_SESSION) {
      throw new BadRequestException(ERROR_MESSAGES.STORAGE.SESSION_FULL);
    }
    await this.bindUser(session, userId);

    const rows = await this.photos.save(
      items.map((item) =>
        this.photos.create({
          sessionId: session.id,
          kind: item.kind,
          contentType: item.contentType,
          size: item.size,
          status: 'uploading',
          priority: this.basePriority(session),
        }),
      ),
    );

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        upload: await this.staging.createUploadTarget({
          key: stagingKeys.raw(session.id, row.id),
          photoId: row.id,
          contentType: row.contentType,
        }),
      })),
    );
  }

  /**
   * Client báo đã gửi xong. Đây là chỗ **đo cỡ thật** — presigned URL của R2
   * không chốt được dung lượng — nên tệp quá cỡ bị xoá ngay tại đây, trước khi
   * worker phải giải mã nó.
   */
  async complete(
    session: UploadSession,
    ids: string[],
    userId?: string,
  ): Promise<StagedPhotoView[]> {
    await this.bindUser(session, userId);
    const rows = await this.photos.findInSession(session.id, ids);

    for (const row of rows) {
      if (row.status !== 'uploading') continue;
      const rawKey = stagingKeys.raw(session.id, row.id);
      const size = await this.staging.size(rawKey);

      if (size === null || size === 0) {
        await this.fail(row, 'missing');
        continue;
      }
      if (size > MAX_UPLOAD_BYTES) {
        await this.staging.remove(rawKey);
        await this.fail(row, 'too_large');
        continue;
      }

      const queued = await this.photos.transition(row.id, ['uploading'], {
        status: 'queued',
        size,
        // Tấm đã được nhận về một thiệp trước khi byte tới nơi thì giữ nguyên
        // mức ưu tiên cao của lượt nhận đó.
        priority: Math.max(row.priority, this.basePriority(session)),
      });
      if (queued) row.status = 'queued';
    }

    return this.views(session.id, ids);
  }

  /**
   * Gỡ một tấm khỏi ô trước khi lưu thiệp. Tấm đã `published` thì **không** xoá
   * tệp: nó đã thuộc một thiệp, và thiệp đó (qua `content`) mới là chỗ quyết
   * định nó còn sống hay không — xem `CardsService.update`.
   */
  async remove(session: UploadSession, photoId: string): Promise<void> {
    const [row] = await this.photos.findInSession(session.id, [photoId]);
    if (!row) return;
    await this.photos.delete({ id: row.id });
    if (row.status === 'published') return;
    await this.staging.remove(stagingKeys.raw(session.id, row.id));
    await this.staging.remove(stagingKeys.ready(session.id, row.id));
  }

  /**
   * Bản đã nén của một tấm còn trong vùng tạm, trả cho **chính phiên** đã gửi
   * nó lên — để editor dựng lại ô ảnh khi khôi phục bản nháp sau một lần tải
   * lại trang (trình duyệt trong app Facebook bị iOS giết khi người dùng sang
   * app khác, và URL `blob:` chết theo trang). Bản nháp chỉ giữ id ảnh; byte
   * nằm ở đây.
   *
   * Không trái luật "ảnh tạm không có URL công khai": route đòi token phiên,
   * và thứ trả ra là bản **đã giải mã và nén lại** chứ không phải byte thô
   * chưa ai kiểm. Tấm chưa nén xong trả 409 để editor đợi rồi hỏi lại; tấm đã
   * nhận về thiệp thì bản tạm đã bị xoá, coi như không còn.
   */
  async readPreview(session: UploadSession, photoId: string): Promise<Buffer> {
    const [row] = await this.photos.findInSession(session.id, [photoId]);
    if (row?.status === 'queued' || row?.status === 'processing') {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: ERROR_MESSAGES.STORAGE.PHOTO_PROCESSING,
        code: ERROR_CODES.STAGED_PHOTO_PROCESSING,
      });
    }
    if (row?.status !== 'ready' && row?.status !== 'publishing') {
      throw new NotFoundException(ERROR_MESSAGES.STORAGE.PHOTO_NOT_FOUND);
    }
    try {
      return await this.staging.read(stagingKeys.ready(session.id, row.id));
    } catch {
      // Lượt nhận về thiệp vừa chép xong và xoá bản tạm ngay giữa hai bước.
      throw new NotFoundException(ERROR_MESSAGES.STORAGE.PHOTO_NOT_FOUND);
    }
  }

  /**
   * Nhận ảnh về một thiệp — gọi lúc bấm Lưu, và **gọi lặp lại** (editor poll)
   * cho tới khi mọi tấm `published` hoặc `failed`.
   *
   * Idempotent: gọi lần hai với cùng thiệp chỉ trả lại trạng thái. Mỗi lượt gọi
   * còn nâng ưu tiên của những tấm chưa nén xong lên đầu hàng đợi — người dùng
   * đang ngồi nhìn nút "Đang lưu", ảnh của họ phải đi trước ảnh của phiên khác.
   *
   * Chép sang kho công khai chạy **ở đây** chứ không ở worker: worker không phải
   * biết gì về thiệp và quyền sở hữu, còn bản AVIF đã nén chỉ vài trăm KB nên
   * đi qua backend không đáng kể.
   */
  async claim(
    userId: string,
    session: UploadSession,
    cardId: string,
    ids: string[],
  ): Promise<StagedPhotoView[]> {
    const card = await this.cardsService.assertOwner(cardId, userId);
    const rows = await this.photos.findInSession(session.id, ids);

    await this.bindUser(session, userId);
    await this.photos.claimForCard(
      session.id,
      rows
        .filter((row) => !row.cardId || row.cardId === card.id)
        .map((row) => row.id),
      card.id,
      STAGED_PRIORITY.claiming,
    );

    const stalePublishing = Date.now() - STALE_PUBLISHING_MS;
    for (const row of rows) {
      // Một tấm đã được nhận về thiệp khác thì không nhận lại được — nếu không
      // hai thiệp sẽ trỏ vào hai bản sao, và thiệp nào lưu sau cũng không biết.
      if (row.cardId && row.cardId !== card.id) continue;
      if (
        row.status === 'publishing' &&
        row.updatedAt.getTime() < stalePublishing
      ) {
        await this.photos.transition(row.id, ['publishing'], {
          status: 'ready',
        });
        row.status = 'ready';
      }
      if (row.status === 'ready') await this.publish(row, card.id);
    }

    return this.views(session.id, ids, card.id);
  }

  /** Receiver của driver `local`: không có presigned URL, byte đi qua đây. */
  async receiveDirect(
    session: UploadSession,
    photoId: string,
    body: NodeJS.ReadableStream,
  ): Promise<void> {
    if (!(this.staging instanceof LocalStagingStorage)) {
      throw new NotFoundException(
        ERROR_MESSAGES.STORAGE.DIRECT_UPLOAD_DISABLED,
      );
    }
    const [row] = await this.photos.findInSession(session.id, [photoId]);
    if (!row || row.status !== 'uploading') {
      throw new NotFoundException(ERROR_MESSAGES.STORAGE.PHOTO_NOT_FOUND);
    }
    try {
      await this.staging.writeStream(
        stagingKeys.raw(session.id, row.id),
        body,
        MAX_UPLOAD_BYTES,
      );
    } catch (error) {
      if (error instanceof StagingTooLargeError) {
        throw new BadRequestException(ERROR_MESSAGES.STORAGE.TOO_LARGE);
      }
      throw error;
    }
  }

  /**
   * Dọn phiên đã hết hạn — cả tệp tạm lẫn hàng trong database.
   *
   * Tấm đã `published` thì tệp nằm ở kho công khai và thuộc về thiệp, nên chỉ
   * bị xoá khi nội dung thiệp **không** trỏ tới nó (lượt Lưu hỏng sau bước
   * nhận ảnh — xem `CardsService.removeUnreferencedPhotos`). Phải làm trước khi
   * xoá phiên: hàng `staged_photos` là dấu vết duy nhất của tệp đó, cascade
   * cuốn nó đi rồi thì không còn gì chỉ ra tệp nào là thừa.
   */
  async purgeExpired(limit = 200): Promise<number> {
    const expired = await this.sessions.findExpired(new Date(), limit);
    for (const session of expired) {
      await this.removeUnreferencedPublished(session.id);
      for (const prefix of stagingKeys.sessionPrefixes(session.id)) {
        await this.staging.removePrefix(prefix);
      }
      // `staged_photos` xoá theo `ON DELETE CASCADE`.
      await this.sessions.delete({ id: session.id });
    }
    return expired.length;
  }

  private async removeUnreferencedPublished(sessionId: string): Promise<void> {
    const byCard = new Map<string, string[]>();
    for (const row of await this.photos.findPublishedInSession(sessionId)) {
      if (!row.cardId || !row.url) continue;
      byCard.set(row.cardId, [...(byCard.get(row.cardId) ?? []), row.url]);
    }

    for (const [cardId, urls] of byCard) {
      try {
        const removed = await this.cardsService.removeUnreferencedPhotos(
          cardId,
          urls,
        );
        if (removed > 0) {
          this.logger.log(
            `Đã xoá ${removed} ảnh nhận về thiệp ${cardId} mà không được lưu vào nội dung.`,
          );
        }
      } catch (error) {
        // Một thiệp dọn hỏng không được chặn việc dọn phiên: tệp tạm của phiên
        // vẫn phải đi, và tệp thừa trong thư mục thiệp tệ nhất là nằm lại.
        this.logger.warn(
          `Không dọn được ảnh thừa của thiệp ${cardId}: ${(error as Error).message}`,
        );
      }
    }
  }

  private async publish(row: StagedPhoto, cardId: string): Promise<void> {
    const locked = await this.photos.transition(row.id, ['ready'], {
      status: 'publishing',
    });
    if (!locked) return;

    const readyKey = stagingKeys.ready(row.sessionId, row.id);
    try {
      const buffer = await this.staging.read(readyKey);
      const stored = await this.storage.save({
        buffer,
        originalName: `${row.id}.avif`,
        mimeType: 'image/avif',
        size: buffer.length,
        folder: `cards/${cardId}/${row.kind === 'album' ? 'album' : 'photos'}`,
      });
      await this.photos.transition(row.id, ['publishing'], {
        status: 'published',
        url: stored.url,
      });
      await this.staging.remove(readyKey);
    } catch (error) {
      this.logger.warn(
        `Không chép được ảnh ${row.id} sang thiệp ${cardId}: ${(error as Error).message}`,
      );
      // Mất bản tạm thì không có gì để thử lại; còn lại trả về `ready` cho lượt
      // poll sau.
      const missing = (await this.staging.size(readyKey)) === null;
      await this.photos.transition(
        row.id,
        ['publishing'],
        missing ? { status: 'failed', error: 'missing' } : { status: 'ready' },
      );
    }
  }

  private async views(
    sessionId: string,
    ids: string[],
    cardId?: string,
  ): Promise<StagedPhotoView[]> {
    const rows = await this.photos.findInSession(sessionId, ids);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id): StagedPhotoView => {
      const row = byId.get(id);
      if (!row) return { id, status: 'failed', error: 'missing' };
      if (cardId && row.cardId && row.cardId !== cardId) {
        return { id, status: 'failed', error: 'other_card' };
      }
      switch (row.status) {
        case 'uploading':
          return { id, status: 'uploading' };
        case 'published':
          return { id, status: 'published', url: row.url ?? undefined };
        case 'failed':
          return { id, status: 'failed', error: row.error ?? undefined };
        default:
          return { id, status: 'processing' };
      }
    });
  }

  private async fail(row: StagedPhoto, error: string): Promise<void> {
    await this.photos.transition(row.id, [row.status], {
      status: 'failed',
      error,
    });
    row.status = 'failed';
  }

  /**
   * Phiên mở lúc chưa đăng nhập được gắn với tài khoản ngay khi người đó đăng
   * nhập và gọi tiếp — từ đó ảnh của họ đi hàng ưu tiên của người đã đăng nhập.
   */
  private async bindUser(session: UploadSession, userId?: string) {
    if (!userId || session.userId) return;
    session.userId = userId;
    await this.sessions.update({ id: session.id }, { userId });
  }

  private basePriority(session: UploadSession): number {
    return session.userId
      ? STAGED_PRIORITY.signedIn
      : STAGED_PRIORITY.anonymous;
  }

  private invalidSession() {
    return new UnauthorizedException({
      statusCode: 401,
      error: 'Unauthorized',
      message: ERROR_MESSAGES.STORAGE.SESSION_INVALID,
      code: ERROR_CODES.UPLOAD_SESSION_INVALID,
    });
  }
}
