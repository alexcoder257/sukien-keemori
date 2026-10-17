import "server-only";
import { REVALIDATE, serverFetch } from "./api";
import { CACHE_TAGS } from "@/constants/cache-tags";
import type { ShowcaseKind } from "@/lib/showcase-link";

export interface CoupleShowcase {
  slug: string;
  /** `slug` là của một thiệp hay của một mẫu — xem `lib/showcase-link.ts`. */
  kind: ShowcaseKind;
  names: string;
  weddingDate: string;
  imagePosition: string;
  /** Ảnh thiệp của cặp đôi. Mỗi record một ảnh riêng để dải chạy không lặp lại. */
  imageSrc: string;
  /**
   * Ảnh bìa tải lên riêng (CMS). `null` thì suy từ `imageSrc` theo quy ước
   * `thumbnail.avif` → `poster.avif`, xem `lib/template-poster.ts`.
   */
  posterSrc?: string | null;
}

export interface HomeStats {
  invitations: number;
  templates: number;
  rating: number;
}

/** Câu hỏi thường gặp — đã chọn ngôn ngữ ở backend theo `locale`. */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * Số liệu trưng ở dải thống kê. Backend trả map phẳng (`{"home.rating": 4.9}`)
 * vì cùng một bảng phục vụ trang chủ; ở đây gom lại thành
 * shape mà component đang dùng.
 */
export async function getHomeStats(): Promise<HomeStats> {
  const stats = await serverFetch<Record<string, number>>("/site-stats", {
    revalidate: REVALIDATE.config,
    tags: [CACHE_TAGS.siteStats],
  });
  return {
    invitations: stats["home.invitations"] ?? 0,
    templates: stats["home.templates"] ?? 0,
    rating: stats["home.rating"] ?? 0,
  };
}

/**
 * Dải thiệp chạy ngang cần đủ record để không thấy chỗ nối; tám cặp đôi với
 * tám ảnh khác nhau là mức tối thiểu cho cảm giác "nhiều thiệp thật".
 */
export async function getCoupleShowcase(): Promise<CoupleShowcase[]> {
  return serverFetch<CoupleShowcase[]>("/couple-showcases", {
    revalidate: REVALIDATE.editorial,
    tags: [CACHE_TAGS.showcase],
  });
}

/**
 * FAQ lấy từ backend chứ không từ dictionary: nội dung của nó đổi theo **chính
 * sách sản phẩm** (giới hạn gói, album) chứ không theo đợt dịch giao diện. Để
 * trong dictionary thì mỗi lần đổi chính sách phải deploy lại frontend — và
 * thực tế bản cũ đã lệch khỏi `docs/business-model.md`.
 *
 * Vì vẫn là text giao diện nên phải truyền `locale`; backend giữ cả hai bản.
 */
export async function getFaqs(locale: string): Promise<FaqItem[]> {
  return serverFetch<FaqItem[]>(`/faqs?locale=${locale}`, {
    revalidate: REVALIDATE.config,
    tags: [CACHE_TAGS.faq],
  });
}
