import { BaseEntity } from '@configuration/base-entity/base.entity';
import {
  INVITATION_KINDS,
  TEMPLATE_CATEGORIES,
  TEMPLATE_COLOR_MAX,
  TEMPLATE_COLORS,
  TEMPLATE_TAGS,
} from '@common/enums/invitation.enum';
import type {
  InvitationKind,
  PhotoSlotKey,
  TemplateCategory,
  TemplateColor,
  TemplateTag,
} from '@common/enums/invitation.enum';
import { TIERS } from '@common/enums/tier.enum';
import type { Tier } from '@common/enums/tier.enum';
import { Check, Column, Entity, Index } from 'typeorm';

/**
 * Metadata của một mẫu thiệp. **Chỉ metadata** — bố cục, font và palette nằm
 * trong component phía frontend (`components/invitation/templates/<slug>`), và
 * `slug` là khoá nối hai bên.
 *
 * Bảng này thay `frontend/lib/data/templates.ts`; kiểu trả về của API giữ đúng
 * shape `WeddingTemplate` để frontend chỉ đổi nguồn dữ liệu, không đổi kiểu.
 */
@Entity('templates')
@Check(
  'CHK_templates_color_tones_max',
  `cardinality("color_tones") <= ${TEMPLATE_COLOR_MAX}`,
)
export class Template extends BaseEntity {
  /**
   * Khoá định danh của mẫu: là URL, là tên thư mục ảnh và là khoá của registry
   * component. Không đổi sau khi phát hành.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 60 })
  slug: string;

  /** Tên riêng của mẫu — dữ liệu, không dịch. */
  @Column({ type: 'varchar', length: 120 })
  name: string;

  /**
   * Cấp thiết kế của mẫu. Không liên quan tới gói dịch vụ: site chỉ bán một
   * gói và thiệp nào cũng đủ tính năng, nên đây chỉ là nhãn thiết kế của mẫu.
   */
  @Column({ type: 'enum', enum: TIERS })
  tier: Tier;

  /**
   * Loại thiệp mà mẫu được dựng cho (`content.kind` của thiệp). Mẫu sinh nhật
   * không có khối cô dâu chú rể, mẫu cưới không có khối "thông tin chính", nên
   * một mẫu chỉ ghép được với thiệp **cùng loại** — `CardsService` chặn ở
   * backend. **Code làm chủ**: loại chốt lúc dựng mẫu, không có trong
   * `UpdateTemplateDto`.
   */
  @Column({ type: 'enum', enum: INVITATION_KINDS, default: 'wedding' })
  kind: InvitationKind;

  @Column({
    type: 'enum',
    enum: TEMPLATE_CATEGORIES,
    array: true,
    default: '{}',
  })
  categories: TemplateCategory[];

  @Column({ type: 'enum', enum: TEMPLATE_TAGS, array: true, default: '{}' })
  tags: TemplateTag[];

  /**
   * 1–2 nhóm màu chủ đạo: màu nền và màu concept của thiết kế. **Code làm
   * chủ**, không phải CMS: màu được chốt lúc dựng mẫu, cùng lúc với chính bảng
   * màu trong CSS Module, nên nó không có trong `UpdateTemplateDto` — để admin
   * sửa thì nhãn trôi khỏi thiết kế mà không ai biết. Trần 2 chặn ở CHECK.
   */
  @Column({
    name: 'color_tones',
    type: 'enum',
    enum: TEMPLATE_COLORS,
    array: true,
    default: '{}',
  })
  colorTones: TemplateColor[];

  /**
   * Các ô ảnh mà thiết kế dàn sẵn — căn cứ xếp gói chứ không phải con số gán
   * tuỳ ý: Free 0 ô, Gold 1–3 ô, Diamond 4–6 ô. Lưu dạng mảng key có ngữ nghĩa
   * để đổi mẫu thì ảnh về đúng chỗ.
   */
  @Column({
    name: 'photo_slots',
    type: 'varchar',
    array: true,
    length: 20,
    default: '{}',
  })
  photoSlots: PhotoSlotKey[];

  /** Vị trí cắt trong ảnh atlas dùng chung, cho mẫu chưa có thumbnail riêng. */
  @Column({
    name: 'image_position',
    type: 'varchar',
    length: 20,
    default: '50% 50%',
  })
  imagePosition: string;

  /** Thumbnail riêng; bỏ trống thì frontend rơi về atlas qua `imagePosition`. */
  @Column({ name: 'image_src', type: 'varchar', length: 255, nullable: true })
  imageSrc: string | null;

  /**
   * Mẫu đang dựng dở thì tắt cờ này: nó biến mất khỏi kho mẫu công khai nhưng
   * thiệp đang dùng nó vẫn render bình thường.
   */
  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;

  /** Thứ tự hiển thị mặc định của kho mẫu; nhỏ hơn thì đứng trước. */
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  /**
   * Mẫu được chọn đưa lên trang chủ (spec CMS mục 8). Tách khỏi `sortOrder` vì
   * đây là hai quyết định khác nhau: thứ tự trong kho mẫu là chuyện xếp hàng,
   * còn dải trang chủ là chuyện marketing chọn mặt gửi vàng.
   */
  @Column({ name: 'featured_on_home', type: 'boolean', default: false })
  featuredOnHome: boolean;

  /** Thứ tự trong dải trang chủ; chỉ có nghĩa khi `featuredOnHome`. */
  @Column({ name: 'homepage_order', type: 'int', default: 0 })
  homepageOrder: number;
}
