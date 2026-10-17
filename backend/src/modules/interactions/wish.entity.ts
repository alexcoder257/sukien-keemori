import {
  WISH_MAX_MESSAGE_LENGTH,
  WISH_MAX_NAME_LENGTH,
} from '@common/constants/invitation.constants';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { WeddingCard } from '@modules/cards/wedding-card.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Một lời chúc trong sổ lưu bút. Khách còn ghi được một thứ nữa là xác nhận
 * tham dự (`Rsvp`), nhưng hai thứ không gộp: lời chúc hiện công khai sau khi
 * duyệt, còn phản hồi tham dự chỉ chủ thiệp đọc.
 *
 * Bảng riêng chứ không nằm trong `wedding_cards.content`: nội dung trong đó do
 * cặp đôi soạn và bị ghi đè nguyên khối mỗi lần lưu editor, còn cái này là dữ
 * liệu người khác gửi lên và có vòng đời duyệt riêng.
 */
@Entity('wishes')
export class Wish extends BaseEntity {
  @Index()
  @Column({ name: 'card_id', type: 'uuid' })
  cardId: string;

  @ManyToOne(() => WeddingCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: WeddingCard;

  @Column({ type: 'varchar', length: WISH_MAX_NAME_LENGTH })
  name: string;

  @Column({ type: 'varchar', length: WISH_MAX_MESSAGE_LENGTH })
  message: string;

  /**
   * Mọi lời chúc gửi lên đều **chờ duyệt**; chỉ lời chúc đã duyệt mới hiện trên
   * thiệp. Duyệt và xoá là quyền của chủ thiệp và backend là nơi thực thi —
   * UI chỉ phản ánh trạng thái (`CLAUDE.md` mục 6).
   */
  @Column({ type: 'boolean', default: false })
  approved: boolean;
}
