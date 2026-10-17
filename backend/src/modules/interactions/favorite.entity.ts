import { BaseEntity } from '@configuration/base-entity/base.entity';
import { User } from '@modules/user/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

/**
 * Mẫu thiệp được người dùng "tim". Lưu theo `templateSlug` chứ không phải khoá
 * ngoại tới `templates`: slug là khoá định danh bền của mẫu, và một mẫu bị gỡ
 * khỏi kho không nên kéo theo lỗi khoá ngoại trong danh sách yêu thích.
 *
 * Thay thế bản `localStorage` ở `frontend/apis/favorite.ts`; hợp đồng API đã
 * ghi sẵn trong file đó và ba route dưới đây khớp đúng chữ ký của nó.
 */
@Entity('favorites')
@Unique(['userId', 'templateSlug'])
export class Favorite extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'template_slug', type: 'varchar', length: 60 })
  templateSlug: string;
}
