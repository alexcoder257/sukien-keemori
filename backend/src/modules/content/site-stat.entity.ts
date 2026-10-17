import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

/**
 * Số liệu trưng ở dải thống kê (trang chủ, trang đối tác): số thiệp đã tạo, số
 * mẫu, điểm trung bình, số đối tác…
 *
 * Cố tình **không** tính bằng `COUNT(*)` trên dữ liệu thật: đây là con số
 * marketing do người vận hành chốt, và một sản phẩm mới sẽ hiện "0 thiệp" nếu
 * đếm thật. Khi số thật vượt số công bố thì admin cập nhật ở đây.
 *
 * `numeric` chứ không `int` vì có mục là điểm trung bình (4.9).
 */
/**
 * Danh sách khoá hợp lệ — **whitelist**, không phải gợi ý.
 *
 * Trang chủ đọc theo đúng những khoá này (`getHomeStats` ở frontend), nên một khoá gõ sai từ CMS không hiện ra ở đâu
 * cả mà chỉ nằm im trong bảng. Thêm số liệu mới là việc phải sửa cả frontend,
 * nên nó đi qua code chứ không qua form.
 */
export const SITE_STAT_KEYS = [
  'home.invitations',
  'home.templates',
  'home.rating',
] as const;

export type SiteStatKey = (typeof SITE_STAT_KEYS)[number];

@Entity('site_stats')
export class SiteStat extends BaseEntity {
  /** Khoá dạng `home.invitations`. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 60 })
  key: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  value: string;
}
