import { BaseEntity } from '@configuration/base-entity/base.entity';
import { CARD_STATUS_DB_VALUES } from '@common/enums/invitation.enum';
import type { CardStatus } from '@common/enums/invitation.enum';
import { TIERS } from '@common/enums/tier.enum';
import type { Tier } from '@common/enums/tier.enum';
import { CARD_SLUG_MAX_LENGTH } from '@common/constants/invitation.constants';
import { User } from '@modules/user/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { InvitationContentDto } from './dto/invitation-content.dto';

/** Nội dung lưu trong cột JSONB. Thiếu `wishes` — xem `InvitationContentDto`. */
export type StoredContent = InvitationContentDto;

@Entity('wedding_cards')
export class WeddingCard extends BaseEntity {
  @Index()
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  /** Đường dẫn công khai `/t/<slug>`. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: CARD_SLUG_MAX_LENGTH })
  slug: string;

  /**
   * Hai đường dẫn riêng của gói Song Hỷ đã **gỡ**: `…-nha-trai-<mã>` và
   * `…-nha-gai-<mã>`. Không còn code nào sinh chúng, nhưng link đã gửi vào
   * nhóm chat phải mở được mãi — `CardsRepository.findBySlug` vẫn tra hai cột
   * này và mở thiệp bình thường (không có nội dung riêng của nhà nào).
   * `CardsService.isSlugFree` vẫn xét chúng để không cấp lại cho thiệp khác.
   */
  @Index('IDX_wedding_cards_groom_slug', {
    unique: true,
    where: 'groom_slug IS NOT NULL',
  })
  @Column({
    name: 'groom_slug',
    type: 'varchar',
    length: CARD_SLUG_MAX_LENGTH,
    nullable: true,
  })
  groomSlug: string | null;

  @Index('IDX_wedding_cards_bride_slug', {
    unique: true,
    where: 'bride_slug IS NOT NULL',
  })
  @Column({
    name: 'bride_slug',
    type: 'varchar',
    length: CARD_SLUG_MAX_LENGTH,
    nullable: true,
  })
  brideSlug: string | null;

  /** Tên hiển thị trong danh sách "Thiệp của tôi", thường là "Chú rể & Cô dâu". */
  @Column({ type: 'varchar', length: 160 })
  title: string;

  /**
   * Mẫu đang dùng, tham chiếu bằng slug chứ không phải khoá ngoại: slug là khoá
   * nối tới component và thư mục ảnh phía frontend, và một mẫu bị gỡ khỏi kho
   * không được kéo theo thiệp của khách.
   */
  @Column({ name: 'template_slug', type: 'varchar', length: 60 })
  templateSlug: string;

  /**
   * Cấp thiết kế của mẫu đang dùng, chụp lại tại thời điểm chọn mẫu. Admin xếp
   * lại gói cho một mẫu thì thiệp đã tạo giữ nguyên điều kiện cũ.
   */
  @Column({ name: 'template_tier', type: 'enum', enum: TIERS })
  templateTier: Tier;

  /**
   * Cột di sản của mô hình nhiều gói: mọi thiệp mới được tạo với `diamond` để
   * mọi phép kiểm còn sót lại đều qua. Client không được đọc nó — thiệp nào
   * cũng có đủ tính năng.
   */
  @Column({ name: 'plan_tier', type: 'enum', enum: TIERS, default: 'diamond' })
  planTier: Tier;

  /**
   * Lúc thiệp được xuất bản lần đầu (thanh toán đã nhận ngoài hệ thống) — mốc
   * đếm 15 ngày khoá tên cô dâu chú rể (`COUPLE_NAMES_LOCK_DAYS`). Chỉ ghi một
   * lần (`??=`), xuất bản lại không dời mốc.
   */
  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  /**
   * Admin mở khoá sửa tên cho thiệp này (cặp đôi liên hệ hỗ trợ). Thắng mốc 15
   * ngày; tắt đi thì luật thời gian có hiệu lực trở lại ngay.
   */
  @Column({ name: 'couple_names_unlocked', type: 'boolean', default: false })
  coupleNamesUnlocked: boolean;

  @Column({ type: 'enum', enum: CARD_STATUS_DB_VALUES, default: 'draft' })
  status: CardStatus;

  @Column({ type: 'jsonb' })
  content: StoredContent;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  /**
   * Cột di sản: link nay vĩnh viễn nên luôn là `null`.
   */
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  /**
   * Thiệp được chọn trưng bày ở trang chủ (spec CMS mục 9). Chỉ admin bật được
   * và chỉ bật cho thiệp đã xuất bản: thiệp thật là của khách, việc đem lên
   * trang chủ phải là **một quyết định có người chịu trách nhiệm**, không phải
   * hệ quả tự động của việc khách bấm xuất bản.
   *
   * Khác `couple_showcases` — bảng kia là ảnh biên tập tự dựng, không dính tới
   * thiệp của ai.
   */
  @Column({ name: 'showcased_on_home', type: 'boolean', default: false })
  showcasedOnHome: boolean;
}
