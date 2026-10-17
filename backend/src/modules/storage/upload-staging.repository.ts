import { Injectable } from '@nestjs/common';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { StagedPhoto } from './staged-photo.entity';
import type { StagedPhotoStatus } from './staged-photo.entity';
import { UploadSession } from './upload-session.entity';

@Injectable()
export class UploadSessionRepository extends Repository<UploadSession> {
  constructor(dataSource: DataSource) {
    super(UploadSession, dataSource.createEntityManager());
  }

  /** `secretHash` là `select: false`, nên chỉ lối này đọc được nó. */
  findWithSecret(id: string): Promise<UploadSession | null> {
    return this.createQueryBuilder('session')
      .addSelect('session.secretHash')
      .where('session.id = :id', { id })
      .getOne();
  }

  findExpired(now: Date, limit: number): Promise<UploadSession[]> {
    return this.find({
      where: { expiresAt: LessThan(now) },
      order: { expiresAt: 'ASC' },
      take: limit,
    });
  }
}

@Injectable()
export class StagedPhotoRepository extends Repository<StagedPhoto> {
  constructor(dataSource: DataSource) {
    super(StagedPhoto, dataSource.createEntityManager());
  }

  countBySession(sessionId: string): Promise<number> {
    return this.countBy({ sessionId });
  }

  /** Những tấm của phiên đã được chép sang thư mục của một thiệp. */
  findPublishedInSession(sessionId: string): Promise<StagedPhoto[]> {
    return this.findBy({ sessionId, status: 'published' });
  }

  findInSession(sessionId: string, ids: string[]): Promise<StagedPhoto[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findBy({ sessionId, id: In(ids) });
  }

  /**
   * Rút việc kế tiếp khỏi hàng đợi và **khoá** nó trong cùng một câu lệnh.
   *
   * `FOR UPDATE SKIP LOCKED` để nhiều worker (hoặc một worker vừa khởi động lại
   * cạnh một worker chưa chết hẳn) không bao giờ rút trùng một tấm. Tấm kẹt ở
   * `processing` quá `staleBefore` được rút lại: worker trước đã chết giữa
   * chừng, và không có ai khác sẽ nhả nó ra.
   */
  async takeNext(staleBefore: Date): Promise<StagedPhoto | null> {
    const rows: unknown = await this.query(
      `UPDATE "staged_photos"
       SET "status" = 'processing',
           "locked_at" = now(),
           "attempts" = "attempts" + 1,
           "updated_at" = now()
       WHERE "id" = (
         SELECT "id" FROM "staged_photos"
         WHERE "status" = 'queued'
            OR ("status" = 'processing' AND "locked_at" < $1)
         ORDER BY "priority" DESC, "created_at" ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING "id"`,
      [staleBefore],
    );
    // `UPDATE ... RETURNING` của driver pg trả `[rows, affected]`.
    const [returned] = rows as [{ id: string }[], number];
    const id = returned?.[0]?.id;
    return id ? this.findOneBy({ id }) : null;
  }

  /**
   * Đổi trạng thái **chỉ khi** hàng còn ở một trong các trạng thái `from`. Đây
   * là khoá lạc quan thay cho transaction: hai lượt poll cùng muốn chép một tấm
   * thì chỉ một lượt thắng, lượt kia nhận `false` và bỏ qua.
   */
  async transition(
    id: string,
    from: StagedPhotoStatus[],
    patch: Partial<
      Pick<
        StagedPhoto,
        'status' | 'size' | 'priority' | 'lockedAt' | 'cardId' | 'url' | 'error'
      >
    >,
  ): Promise<boolean> {
    const result = await this.createQueryBuilder()
      .update(StagedPhoto)
      .set(patch)
      .where('id = :id', { id })
      .andWhere('status IN (:...from)', { from })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  /**
   * Nâng ưu tiên cho những tấm của thiệp đang được lưu, kể cả tấm đang
   * `uploading` — lúc byte tới nơi nó vào hàng với đúng mức ưu tiên này.
   */
  async claimForCard(
    sessionId: string,
    ids: string[],
    cardId: string,
    priority: number,
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.createQueryBuilder()
      .update(StagedPhoto)
      .set({ cardId, priority })
      .where('session_id = :sessionId', { sessionId })
      .andWhere('id IN (:...ids)', { ids })
      .andWhere('status NOT IN (:...done)', { done: ['published', 'failed'] })
      .execute();
  }
}
