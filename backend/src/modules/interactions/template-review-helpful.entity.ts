import { BaseEntity } from '@configuration/base-entity/base.entity';
import { User } from '@modules/user/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { TemplateReview } from './template-review.entity';

/**
 * Một lượt "Hữu ích" trên một đánh giá mẫu thiệp.
 *
 * Lưu từng lượt thành một hàng thay vì tăng một cột đếm: có hàng mới biết được
 * ai đã bấm, mà đó chính là thứ UI cần để vẽ nút ở trạng thái đã bấm và để bấm
 * lần hai là bỏ. Ràng buộc `@Unique` khoá chặt "mỗi người một lượt cho mỗi
 * đánh giá" ở tầng DB, nên hai request song song cũng không cộng thành hai.
 *
 * Khác `templateSlug` của `Favorite`/`TemplateReview`: ở đây khoá ngoại tới
 * `template_reviews` là đúng, vì một lượt hữu ích không có ý nghĩa gì nếu đánh
 * giá gốc biến mất — `CASCADE` dọn luôn khi admin gỡ một nhận xét.
 */
@Entity('template_review_helpful')
@Unique(['userId', 'reviewId'])
export class TemplateReviewHelpful extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'review_id', type: 'uuid' })
  reviewId: string;

  @ManyToOne(() => TemplateReview, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: TemplateReview;
}
