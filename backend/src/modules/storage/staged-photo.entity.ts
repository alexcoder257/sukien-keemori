import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UploadSession } from './upload-session.entity';

export const STAGED_PHOTO_KINDS = ['photo', 'album'] as const;
export type StagedPhotoKind = (typeof STAGED_PHOTO_KINDS)[number];

/**
 * Vòng đời một tấm ảnh trong vùng tạm:
 *
 * `uploading` → trình duyệt đã có URL, byte chưa chắc đã tới.
 * `queued` → byte đã tới, đúng cỡ, chờ worker nén.
 * `processing` → worker đang giải mã + nén AVIF.
 * `ready` → bản AVIF nằm ở `ready/`, chờ được nhận về một thiệp.
 * `publishing` → đang chép sang kho công khai (khoá chống chép hai lần).
 * `published` → đã nằm trong `cards/<id>/`, `url` là đường dẫn công khai.
 * `failed` → không phải ảnh, quá cỡ, mất tệp hoặc nén hỏng quá số lần.
 */
export const STAGED_PHOTO_STATUSES = [
  'uploading',
  'queued',
  'processing',
  'ready',
  'publishing',
  'published',
  'failed',
] as const;
export type StagedPhotoStatus = (typeof STAGED_PHOTO_STATUSES)[number];

/**
 * Một tấm ảnh trong vùng tạm, đồng thời là **một việc trong hàng đợi nén**.
 * Hàng đợi là chính bảng này (`FOR UPDATE SKIP LOCKED`) chứ không phải Redis
 * hay pg-boss: lượng việc nhỏ, và thêm một hệ thống nữa trên VPS 2 lõi là thêm
 * một thứ để hỏng.
 *
 * `card_id` không có khoá ngoại vì hàng này sống tối đa một ngày; thiệp bị xoá
 * trước lúc đó thì bước chép sang kho công khai tự hỏng mềm (`assertOwner`).
 */
@Entity('staged_photos')
@Check(
  'CHK_staged_photos_status',
  `"status" IN ('uploading', 'queued', 'processing', 'ready', 'publishing', 'published', 'failed')`,
)
@Check('CHK_staged_photos_kind', `"kind" IN ('photo', 'album')`)
@Index('IDX_staged_photos_queue', ['status', 'priority', 'createdAt'])
export class StagedPhoto extends BaseEntity {
  @Index('IDX_staged_photos_session')
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => UploadSession, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_staged_photos_session',
  })
  session?: UploadSession;

  @Column({ type: 'varchar', length: 8 })
  kind: StagedPhotoKind;

  @Column({ type: 'varchar', length: 16 })
  status: StagedPhotoStatus;

  @Column({ name: 'content_type', type: 'varchar', length: 32 })
  contentType: string;

  @Column({ type: 'integer', nullable: true })
  size: number | null;

  @Column({ type: 'integer', default: 0 })
  priority: number;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt: Date | null;

  @Column({ name: 'card_id', type: 'uuid', nullable: true })
  cardId: string | null;

  /** Đường dẫn công khai sau khi `published`. */
  @Column({ type: 'varchar', length: 512, nullable: true })
  url: string | null;

  /** Mã lỗi máy đọc (`invalid_image`, `too_large`, `missing`…), không phải câu hiển thị. */
  @Column({ type: 'varchar', length: 32, nullable: true })
  error: string | null;
}
