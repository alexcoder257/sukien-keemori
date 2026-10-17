import {
  GUEST_NAME_MAX_LENGTH,
  GUEST_TOKEN_MAX_LENGTH,
} from '@common/constants/invitation.constants';
import type { FamilySide } from '@common/enums/family-side.enum';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { WeddingCard } from './wedding-card.entity';

/**
 * Một khách mời có link riêng: `/t/<slug>?khach=<token>` mở thiệp với lời chào
 * "Kính mời: <tên>" trên màn mở đầu.
 *
 * Tên do cặp đôi gõ trong editor (`content.guestInvite.guestList`, mỗi dòng một
 * khách); bảng này tồn tại chỉ để **mã trong link đứng yên** qua các lần lưu.
 * Nội dung thiệp bị ghi đè nguyên khối mỗi lần bấm Lưu, nên nếu mã sinh lại mỗi
 * lần thì sửa một lỗi chính tả ở dòng 40 là 39 link đã gửi đi đổi nghĩa. Xem
 * `CardsService.syncGuests` cho luật giữ mã.
 *
 * Mã chỉ cần duy nhất **trong một thiệp**: link luôn đi kèm slug, và tra khách
 * luôn tra theo cặp `(card_id, token)`.
 */
@Entity('card_guests')
@Index(['cardId', 'token'], { unique: true })
export class CardGuest extends BaseEntity {
  @Index()
  @Column({ name: 'card_id', type: 'uuid' })
  cardId: string;

  @ManyToOne(() => WeddingCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: WeddingCard;

  /** Nguyên văn cách xưng hô cặp đôi gõ: "Anh Chị Cường Thu", "Bạn Linh và người thương". */
  @Column({ type: 'varchar', length: GUEST_NAME_MAX_LENGTH })
  name: string;

  @Column({ type: 'varchar', length: GUEST_TOKEN_MAX_LENGTH })
  token: string;

  /** Thứ tự dòng trong ô nhập — danh sách link hiện đúng thứ tự cặp đôi đã gõ. */
  @Column({ type: 'int' })
  position: number;

  /**
   * Khách của nhà nào. Mọi hàng mới là `groom`. Hàng `bride` chỉ còn ở thiệp từng
   * bật gói Song Hỷ (đã gỡ); chúng được giữ nguyên và mã của chúng vẫn chào
   * đúng tên khách trên link riêng.
   */
  @Column({ type: 'varchar', length: 10, default: 'groom' })
  side: FamilySide;
}
