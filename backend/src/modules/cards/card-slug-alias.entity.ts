import { CARD_SLUG_MAX_LENGTH } from '@common/constants/invitation.constants';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { WeddingCard } from './wedding-card.entity';

/**
 * Đường dẫn **cũ** của một thiệp, giữ lại để link đã phát ra ngoài không chết.
 *
 * Đây là lý do tồn tại của cả bảng: link thiệp cưới được in lên thiệp giấy và
 * dán vào nhóm chat gia đình. Đổi đường dẫn mà bỏ luôn đường cũ thì những chỗ
 * đó thành 404, và **không ai báo lại cho cặp đôi biết** — khách chỉ lặng lẽ
 * không mở được thiệp. Một bảng nhỏ đổi lấy việc đó là rẻ.
 *
 * Đổi tên bao nhiêu lần thì có bấy nhiêu hàng, tất cả cùng trỏ về một thiệp.
 * Không có đường xoá: một đường dẫn đã từng phát ra ngoài thì vĩnh viễn không
 * được cấp lại cho thiệp của người khác.
 */
@Entity('card_slug_aliases')
export class CardSlugAlias extends BaseEntity {
  /**
   * Đường dẫn cũ. `unique` trong phạm vi bảng này; việc nó không được trùng với
   * `wedding_cards.slug` do `CardsService.assertSlugFree` giữ, vì Postgres
   * không có unique index bắc qua hai bảng.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: CARD_SLUG_MAX_LENGTH })
  slug: string;

  @Index()
  @Column({ name: 'card_id', type: 'uuid' })
  cardId: string;

  @ManyToOne(() => WeddingCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: WeddingCard;
}
