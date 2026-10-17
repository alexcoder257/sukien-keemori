import "server-only";
import { REVALIDATE, serverFetch } from "./api";
import { CACHE_TAGS } from "@/constants/cache-tags";
import type { ShowcaseKind } from "@/lib/showcase-link";

export interface PublicSiteSettings {
  /** Link Messenger của fanpage; `null` là chưa cấu hình — không vẽ nút chat. */
  messengerUrl: string | null;
  /**
   * Thiệp mà nút "Xem thiệp mẫu" ở hero dẫn tới. `null` là chưa cấu hình —
   * người gọi rơi về `DEMO_INVITATION_SLUG`, xem `hero.tsx`.
   */
  demoCardSlug: string | null;
  /** `demoCardSlug` là thiệp (`card`) hay mẫu (`template`). */
  demoCardKind: ShowcaseKind;
  /**
   * Kênh mạng xã hội và email ở chân trang. `null` là chưa cấu hình — biểu
   * tượng vẫn hiện nhưng không bấm được (email rơi về `CONTACT.supportEmail`),
   * xem `site-footer.tsx`.
   */
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  /**
   * Số Zalo nội địa 10 số (`0358465162`), đã chuẩn hoá ở backend. Link và cách
   * nhóm số nằm ở `lib/zalo.ts`.
   */
  zaloPhone: string | null;
  contactEmail: string | null;
}

/**
 * Phần cấu hình vận hành mà trang khách được đọc (`GET /settings/public`).
 *
 * Hỏng thì trả về cấu hình rỗng chứ không ném: layout gốc gọi hàm này, một lỗi
 * ở đây sẽ hạ nguyên site chỉ vì thiếu một cái nút phụ trợ.
 */
export async function getPublicSettings(): Promise<PublicSiteSettings> {
  try {
    return await serverFetch<PublicSiteSettings>("/settings/public", {
      revalidate: REVALIDATE.config,
      // Backend xoá tag này ngay khi admin lưu cấu hình.
      tags: [CACHE_TAGS.siteSettings],
    });
  } catch {
    return {
      messengerUrl: null,
      demoCardSlug: null,
      demoCardKind: "card",
      facebookUrl: null,
      instagramUrl: null,
      tiktokUrl: null,
      zaloPhone: null,
      contactEmail: null,
    };
  }
}
