import { VISITOR_ID_MAX_LENGTH } from '@common/constants/invitation.constants';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { WeddingCard } from './wedding-card.entity';

/**
 * Một **người xem** đã mở thiệp, không phải một lượt mở.
 *
 * Trần của link chưa thanh toán là "15 khách", nên thứ phải đếm là người chứ
 * không phải số lần tải trang: một người mở rồi F5 bốn lần vẫn là một khách, và
 * trước khi có bảng này thì đó là 5 lượt, đốt một phần ba hạn mức của cặp đôi.
 *
 * Khoá nhận diện là `visitor_id` — một chuỗi ngẫu nhiên `proxy.ts` phát vào
 * cookie ở lần đầu vào `/t/<slug>`. **Không dùng IP**: nhà mạng di động Việt Nam
 * NAT chung một địa chỉ cho rất nhiều thuê bao, nên đếm theo IP thì cả một
 * phòng khách dùng chung wifi bị gộp thành một khách, còn 15 khách dùng 4G có
 * thể chỉ tính là một. Cũng không dùng vân tay thiết bị: nó là dữ liệu cá nhân
 * để đổi lấy một con số đếm mà không cần chính xác đến thế.
 *
 * Cookie xoá được và trình duyệt ẩn danh thì mỗi lần một `visitor_id` mới, nên
 * con số này là **chặn dưới** của lượng khách thật. Đó là đánh đổi có chủ ý:
 * trần 15 khách là hàng rào chống lạm dụng nhẹ, không phải phép đo doanh thu.
 */
@Entity('card_views')
@Index('IDX_card_views_card_visitor', ['cardId', 'visitorId'], { unique: true })
export class CardView extends BaseEntity {
  @Column({ name: 'card_id', type: 'uuid' })
  cardId: string;

  @ManyToOne(() => WeddingCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: WeddingCard;

  /** Chuỗi ngẫu nhiên trong cookie của người xem; không suy ra được danh tính. */
  @Column({
    name: 'visitor_id',
    type: 'varchar',
    length: VISITOR_ID_MAX_LENGTH,
  })
  visitorId: string;
}
