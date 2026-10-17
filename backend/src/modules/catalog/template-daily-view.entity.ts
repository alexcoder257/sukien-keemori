import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

/**
 * Hai mức khách "bấm vào" một mẫu: `open` là mở xem mẫu (hộp thoại xem nhanh
 * trong kho mẫu, hoặc trang giới thiệu `/mau-thiep/<slug>`), `demo` là mở bản
 * thiệp đầy đủ `/mau-thiep/<slug>/demo`.
 */
export const TEMPLATE_VIEW_KINDS = ['open', 'demo'] as const;
export type TemplateViewKind = (typeof TEMPLATE_VIEW_KINDS)[number];

/**
 * Lượt xem của một mẫu trong kho, gộp **theo ngày** — một hàng cho mỗi cặp
 * (ngày, mẫu). Cùng tinh thần với `daily_visits`: câu hỏi là "mẫu nào được
 * bấm vào nhiều", không phải "ai bấm", nên không lưu từng lượt và không có
 * định danh nào.
 *
 * Trình duyệt tự khử trùng lặp: mỗi mẫu chỉ báo một lần mỗi ngày cho mỗi loại
 * (mốc lưu ở `localStorage`, xem `frontend/components/template/
 * template-view-beacon.tsx`), nên con số gần với "số người xem mẫu trong
 * ngày" hơn là số lần tải trang. Vẫn là ước lượng — đổi máy hay xoá dữ liệu
 * trình duyệt là đếm lại.
 */
@Entity('template_daily_views')
@Index('IDX_template_daily_views_day_slug', ['day', 'templateSlug'], {
  unique: true,
})
export class TemplateDailyView extends BaseEntity {
  /** Ngày dạng `YYYY-MM-DD` theo giờ Việt Nam. */
  @Column({ type: 'date' })
  day: string;

  /** Slug của mẫu; không khoá ngoại để xoá mẫu không cuốn theo số liệu. */
  @Column({ name: 'template_slug', type: 'varchar', length: 60 })
  templateSlug: string;

  /** Lượt mở xem mẫu: hộp thoại xem nhanh hoặc trang giới thiệu mẫu. */
  @Column({ name: 'open_views', type: 'int', default: 0 })
  openViews: number;

  /** Lượt mở bản demo đầy đủ `/mau-thiep/<slug>/demo`. */
  @Column({ name: 'demo_views', type: 'int', default: 0 })
  demoViews: number;
}
