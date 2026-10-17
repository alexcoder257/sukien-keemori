import type { CoupleShowcase } from '@modules/content/couple-showcase.entity';
import type { SiteStat } from '@modules/content/site-stat.entity';
import { SHOWCASE_CARD_SEEDS } from './showcase-cards.seed';

/**
 * Nội dung trang chủ, chuyển từ `frontend/lib/data/home.ts` (bản mock cuối cùng
 * của phần này).
 */

export type CoupleShowcaseSeed = Pick<
  CoupleShowcase,
  'slug' | 'names' | 'weddingDate' | 'imageSrc' | 'imagePosition'
>;

/**
 * Dải "Cặp đôi đã tạo thiệp" ở trang chủ. Mỗi hàng **phải** trỏ tới một thiệp có
 * thật trong `wedding_cards`: ô trong dải là một link `/t/<slug>`, và phụ đề
 * ngay bên cạnh nói "thiệp thật, do các cặp đôi tự tạo trên nền tảng". Vì vậy
 * danh sách này suy thẳng từ `SHOWCASE_CARD_SEEDS` chứ không khai tay — khai
 * tay là cách cũ, và cách cũ để lại bảy ô bấm vào ra 404.
 *
 * Ảnh là `thumbnail.avif` của chính mẫu thiệp đó, neo ở mép trên: thumbnail là
 * ảnh chụp dài toàn bộ thiệp, nên phần lọt vào khung chính là màn bìa.
 */
export const COUPLE_SHOWCASE_SEEDS: CoupleShowcaseSeed[] =
  SHOWCASE_CARD_SEEDS.map((card) => ({
    slug: card.slug,
    names: card.title,
    weddingDate: card.weddingDate,
    imagePosition: '50% 0%',
    imageSrc: card.imageSrc,
  }));

export type SiteStatSeed = Pick<SiteStat, 'key'> & { value: number };

/**
 * Số liệu marketing — con số công bố, không phải `COUNT(*)` trên dữ liệu thật.
 * Xem ghi chú trong `SiteStat` về lý do.
 */
export const SITE_STAT_SEEDS: SiteStatSeed[] = [
  { key: 'home.invitations', value: 12_000 },
  // Kho mẫu đang trống; tăng lại khi có mẫu mới.
  { key: 'home.templates', value: 0 },
  { key: 'home.rating', value: 4.9 },
];
