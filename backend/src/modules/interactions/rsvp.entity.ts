import { RSVP_NAME_MAX_LENGTH } from '@common/constants/invitation.constants';
import type { FamilySide } from '@common/enums/family-side.enum';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { CardGuest } from '@modules/cards/card-guest.entity';
import { WeddingCard } from '@modules/cards/wedding-card.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Một phản hồi xác nhận tham dự khách gửi từ thiệp.
 *
 * Khác lời chúc ở chỗ nó **không bao giờ hiện công khai**: tên ai đi ai không là
 * chuyện riêng của cặp đôi, nên không có trạng thái duyệt và không có route
 * công khai nào đọc lại.
 *
 * Hai loại phản hồi, phân biệt bằng `guest_id`:
 *
 * - Từ **link mời riêng** (`?khach=`): gắn với đúng một hàng `card_guests`, và
 *   mỗi khách chỉ có **một** phản hồi — gửi lại là sửa bản cũ (unique index
 *   bên dưới). Người cầm link đổi ý từ "có" sang "không" phải thay được câu trả
 *   lời, không phải để lại hai dòng mâu thuẫn.
 * - Từ **link chung**: `guest_id = null`, không có gì để khử trùng lặp — tên
 *   do khách tự gõ, hai "Bạn Minh" rất có thể là hai người. Chủ thiệp xoá tay
 *   dòng thừa.
 *
 * `guest_id` là `ON DELETE SET NULL`, không phải `CASCADE`: cặp đôi sửa chính
 * tả một tên trong danh sách là `CardsService.planGuests` xoá hàng khách cũ và
 * sinh hàng mới. Cuốn phản hồi theo thì một lỗi chính tả xoá mất câu trả lời
 * khách đã gửi. `name` là ảnh chụp lúc gửi nên dòng đó vẫn tự đọc được.
 */
@Entity('rsvps')
@Index('IDX_rsvps_guest', ['guestId'], {
  unique: true,
  where: '"guest_id" IS NOT NULL',
})
export class Rsvp extends BaseEntity {
  @Index('IDX_rsvps_card')
  @Column({ name: 'card_id', type: 'uuid' })
  cardId: string;

  @ManyToOne(() => WeddingCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: WeddingCard;

  @Column({ name: 'guest_id', type: 'uuid', nullable: true })
  guestId: string | null;

  @ManyToOne(() => CardGuest, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'guest_id' })
  guest: CardGuest | null;

  @Column({ type: 'varchar', length: RSVP_NAME_MAX_LENGTH })
  name: string;

  @Column({ type: 'boolean' })
  attending: boolean;

  /**
   * Số người sẽ tới, tính cả người gửi. `0` khi không tham dự — lưu hẳn con số
   * thay vì để trống, để phép cộng tổng khách không phải nhớ lọc theo cột khác.
   */
  @Column({ name: 'party_size', type: 'int' })
  partySize: number;

  /**
   * Cột di sản của gói Song Hỷ (đã gỡ) từng tách xác nhận tham dự theo nhà.
   * Code không còn ghi giá trị nào ngoài mặc định `groom`; hàng `bride` cũ vẫn
   * được chủ thiệp đọc bình thường.
   */
  @Column({ type: 'varchar', length: 10, default: 'groom' })
  side: FamilySide;
}
