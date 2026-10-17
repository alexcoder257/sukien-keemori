import {
  REVIEW_MAX_COMMENT_LENGTH,
  REVIEW_MAX_RATING,
  REVIEW_MIN_RATING,
} from '@common/constants/review.constants';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { User } from '@modules/user/user.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

/**
 * Đánh giá một **mẫu thiệp** trong kho mẫu: điểm 1–5 sao kèm nhận xét tuỳ chọn.
 *
 * Đây **không phải** lời chúc (`Wish`). Hai thứ khác nhau về mọi mặt: lời chúc
 * là thứ khách mời viết vào thiệp cưới của một cặp đôi và phải qua duyệt; cái
 * này là người dùng đã đăng nhập nhận xét về một sản phẩm trong kho mẫu, hiện
 * ngay và không có bước duyệt.
 *
 * Khoá theo `templateSlug` chứ không phải khoá ngoại tới `templates`, cùng lý do
 * với `Favorite`: slug là định danh bền của mẫu, và gỡ một mẫu khỏi kho không
 * nên làm hỏng dữ liệu người dùng đã gửi lên.
 *
 * `@Unique(['userId', 'templateSlug'])` là chỗ thực thi quy tắc **mỗi người một
 * đánh giá cho mỗi mẫu** — gửi lần hai là sửa lại đánh giá cũ, không tạo bản
 * mới. Ràng buộc nằm ở DB nên hai request song song cũng không lách được.
 */
@Entity('template_reviews')
@Unique(['userId', 'templateSlug'])
@Check(`"rating" BETWEEN ${REVIEW_MIN_RATING} AND ${REVIEW_MAX_RATING}`)
export class TemplateReview extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'template_slug', type: 'varchar', length: 60 })
  templateSlug: string;

  /** 1–5 sao. `smallint` là đủ và rẻ hơn `int` cho một cột chỉ có 5 giá trị. */
  @Column({ type: 'smallint' })
  rating: number;

  /** Nhận xét tuỳ chọn — `null` nghĩa là người dùng chỉ chấm sao. */
  @Column({
    type: 'varchar',
    length: REVIEW_MAX_COMMENT_LENGTH,
    nullable: true,
  })
  comment: string | null;
}
