import type { ShowcaseKind } from '@common/enums/invitation.enum';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity } from 'typeorm';

/**
 * Cấu hình vận hành toàn site — **một hàng duy nhất**.
 *
 * Dạng bảng một hàng với cột có kiểu, không phải bảng `key`/`value` chung: mỗi
 * thiết lập ở đây có kiểu và miền giá trị riêng (số ngày phải > 0, số lượt xem
 * phải > 0), mà bảng key/value thì mọi thứ đều là chuỗi và không DTO nào kiểm
 * được. Thêm một thiết lập là thêm một cột — rõ ràng hơn hẳn một khoá magic
 * string rải trong code.
 *
 * Ba cột `unpaid_link_days`, `unpaid_purge_days`, `unpaid_viewer_limit` còn
 * trong database (cột có DEFAULT nên không chặn việc ghi hàng) nhưng không còn
 * thuộc entity: link thiệp nay vĩnh viễn, không có hạn dùng thử hay trần người
 * xem để chỉnh.
 */
@Entity('site_settings')
export class SiteSettings extends BaseEntity {
  /**
   * Số mẫu thiệp hiện trên trang chủ (spec CMS mục 8). Nằm ở đây chứ không ở
   * `catalog` vì nó là **số lượng chỗ trên trang**, thuộc về bố cục trang chủ;
   * còn *mẫu nào* được chọn thì là cờ `featuredOnHome` của từng mẫu.
   */
  @Column({ name: 'homepage_template_count', type: 'int', default: 6 })
  homepageTemplateCount: number;

  /**
   * Link Messenger của fanpage, cho nút chat nổi ở góc phải dưới trang khách.
   *
   * Ở đây chứ không phải biến môi trường vì đổi fanpage là việc vận hành, không
   * phải việc deploy. `null` là trạng thái hợp lệ — chưa cấu hình thì frontend
   * không vẽ nút, tốt hơn hẳn một nút dẫn tới trang 404 của Facebook.
   */
  @Column({
    name: 'messenger_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  messengerUrl: string | null;

  /**
   * Thiệp mẫu mà nút "Xem thiệp mẫu" ở hero trang chủ dẫn tới (`/t/<slug>`).
   *
   * Ở đây chứ không phải hằng số trong code vì đây là **quyết định biên tập**:
   * mẫu nào đang đẹp nhất để đem ra chào hàng đổi theo đợt, còn deploy lại
   * frontend thì không. `null` là chưa cấu hình — frontend rơi về
   * `DEMO_INVITATION_SLUG`, nên nút không bao giờ dẫn tới `/t/undefined`.
   */
  @Column({
    name: 'demo_card_slug',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  demoCardSlug: string | null;

  /**
   * `demoCardSlug` ở trên là của một thiệp hay của một mẫu — xem
   * `SHOWCASE_KINDS`. Nút hero dẫn tới `/t/<slug>` hoặc
   * `/mau-thiep/<slug>/demo` tuỳ giá trị này.
   */
  @Column({
    name: 'demo_card_kind',
    type: 'varchar',
    length: 20,
    default: 'card',
  })
  demoCardKind: ShowcaseKind;

  /**
   * Kênh mạng xã hội ở chân trang khách. Cùng lý do với `messengerUrl`: đổi
   * tài khoản là việc vận hành, không phải việc deploy. `null` là chưa có kênh
   * đó — frontend vẫn vẽ biểu tượng nhưng không bấm được, thay vì dẫn tới một
   * trang không tồn tại.
   */
  @Column({
    name: 'facebook_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  facebookUrl: string | null;

  @Column({
    name: 'instagram_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  instagramUrl: string | null;

  @Column({ name: 'tiktok_url', type: 'varchar', length: 255, nullable: true })
  tiktokUrl: string | null;

  /**
   * Số điện thoại Zalo, dạng nội địa 10 số (`0xxxxxxxxx`). Lưu số chứ không
   * lưu URL: trang Thông tin doanh nghiệp in chính con số, còn link
   * `https://zalo.me/<số>` frontend tự dựng.
   */
  @Column({ name: 'zalo_phone', type: 'varchar', length: 20, nullable: true })
  zaloPhone: string | null;

  /**
   * Email ở biểu tượng thư của chân trang.
   *
   * **Không** thay cho `CONTACT.supportEmail` của frontend: địa chỉ đó được
   * trích nguyên văn trong văn bản pháp lý có phiên bản, nên nó chỉ đổi cùng
   * một lần phát hành văn bản mới. Để CMS sửa được nó là để một cú bấm Lưu âm
   * thầm đổi nội dung của Điều khoản đã công bố.
   */
  @Column({
    name: 'contact_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  contactEmail: string | null;
}
