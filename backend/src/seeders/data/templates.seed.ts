import type { Template } from '@modules/catalog/template.entity';

/**
 * Các mẫu đang có, chuyển từ `frontend/lib/data/templates.ts`. Tier và số ô ảnh
 * phải khớp `docs/business-model.md` mục 3 — tài liệu đó là nguồn tham chiếu
 * duy nhất cho câu hỏi "mẫu này thuộc gói nào".
 *
 * Thứ tự trong mảng là thứ tự hiển thị mặc định của kho mẫu (`sortOrder` sinh
 * từ chỉ số). Bốn mẫu đầu phải phủ đủ ba gói vì trang chủ lấy đúng bốn mẫu đó.
 */
export type TemplateSeed = Pick<
  Template,
  | 'slug'
  | 'name'
  | 'tier'
  | 'kind'
  | 'categories'
  | 'colorTones'
  | 'tags'
  | 'photoSlots'
  | 'imagePosition'
> & {
  imageSrc?: string;
  /**
   * Dải mẫu trang chủ. Có mặt ở đây để một database dựng từ số 0 ra giống
   * production, nơi vận hành đã chọn dải này trong CMS. Chỉ áp cho mẫu **chưa
   * có** trong DB — mẫu đã có thì đây là cột CMS làm chủ, seed không đụng tới
   * (`CODE_OWNED_TEMPLATE_FIELDS` trong `seed.ts`).
   */
  featuredOnHome?: boolean;
  homepageOrder?: number;
};

// Toàn bộ mẫu cũ đã gỡ (migration `RemoveAllTemplates`). Mẫu mới thêm vào đây
// cho DB dựng từ số 0, và bằng một migration cho DB đang chạy.
export const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    slug: 'burgundy-birthday',
    name: 'Burgundy',
    tier: 'gold',
    kind: 'birthday',
    categories: ['luxury', 'formal'],
    colorTones: ['red', 'white'],
    tags: ['new'],
    photoSlots: ['cover'],
    imagePosition: '50% 0%',
    imageSrc: '/images/templates/burgundy-birthday/thumbnail.avif',
  },
];
