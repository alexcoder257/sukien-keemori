import type { ShowcaseKind } from '@common/enums/invitation.enum';
import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

/**
 * Dải thiệp chạy ngang ở trang chủ. Mỗi hàng là **một ô trong dải**, và `slug`
 * của nó phải là slug của một thiệp có thật trong `wedding_cards`: ô là link
 * `/t/<slug>`, còn phụ đề ngay cạnh dải nói "thiệp thật, do các cặp đôi tự tạo
 * trên nền tảng". Bảng này chỉ giữ phần *trưng bày* (ảnh, thứ tự, bật/tắt) —
 * nội dung thiệp vẫn nằm ở `wedding_cards`.
 *
 * Thiệp đem lên đây là **thiệp demo do mình dựng** (`seeders/data/showcase-cards.seed.ts`),
 * không phải thiệp của khách: thiệp khách thuộc về khách và không được đem lên
 * trang chủ nếu chưa xin phép. Cột `wedding_cards.showcased_on_home` là đường
 * dành cho trường hợp đã xin phép, và nó là một quyết định có người chịu trách
 * nhiệm chứ không phải hệ quả tự động.
 *
 * Dải cần đủ bản ghi để không thấy chỗ nối khi chạy vòng — tám ô là mức tối
 * thiểu cho cảm giác "nhiều thiệp thật".
 */
@Entity('couple_showcases')
export class CoupleShowcase extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 60 })
  slug: string;

  /**
   * `slug` ở trên là của một thiệp (`/t/<slug>`) hay của một mẫu
   * (`/mau-thiep/<slug>/demo`). Xem `SHOWCASE_KINDS`.
   *
   * Mặc định `card` vì mọi hàng có sẵn đều là thiệp — cột này thêm sau.
   */
  @Column({ type: 'varchar', length: 20, default: 'card' })
  kind: ShowcaseKind;

  @Column({ type: 'varchar', length: 120 })
  names: string;

  /** Ngày cưới dạng chuỗi hiển thị (`22/11/2026`) — đây là nhãn, không phải mốc để tính toán. */
  @Column({ name: 'wedding_date', type: 'varchar', length: 30 })
  weddingDate: string;

  /**
   * Ảnh **chụp dài** toàn bộ thiệp — card trên trang chủ pan nó từ đầu xuống
   * cuối khi hover (vai `thumbnail.avif` của kho mẫu).
   */
  @Column({ name: 'image_src', type: 'varchar', length: 255 })
  imageSrc: string;

  /**
   * Ảnh **bìa** của card lúc nghỉ (vai `poster.avif`, khổ 0.78). `null` thì
   * frontend suy từ `imageSrc` theo quy ước tên `thumbnail.avif` →
   * `poster.avif`; ảnh tải lên không theo quy ước đó nên phải khai riêng, nếu
   * không card nạp nguyên ảnh chụp dài chỉ để hiện màn bìa.
   */
  @Column({ name: 'poster_src', type: 'varchar', length: 255, nullable: true })
  posterSrc: string | null;

  @Column({
    name: 'image_position',
    type: 'varchar',
    length: 30,
    default: 'center',
  })
  imagePosition: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;
}
