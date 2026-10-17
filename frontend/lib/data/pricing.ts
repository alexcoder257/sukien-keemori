import "server-only";
import { CUSTOM_CARD_PRICE } from "@/constants/pricing";
import { CACHE_TAGS } from "@/constants/cache-tags";
import { REVALIDATE, serverFetch } from "./api";

export interface PackagePricing {
  /** Giá niêm yết, VND. */
  price: number;
  /** Khuyến mãi gói, phần trăm; `null` là không có. */
  discountPercent: number | null;
  /** Giá sau khuyến mãi gói (chưa tính mã giảm giá). */
  finalPrice: number;
}

/**
 * Giá của gói duy nhất (`GET /pricing`, công khai).
 *
 * Có tag `pricing`: backend bắn revalidate ngay khi admin bấm Lưu ở "Bảng giá".
 * Hỏng thì rơi về `CUSTOM_CARD_PRICE` chứ không ném — trang giá và trang thông
 * tin doanh nghiệp là trang tĩnh, một lỗi mạng không được hạ cả hai.
 */
export async function getPricing(): Promise<PackagePricing> {
  const fallback: PackagePricing = {
    price: CUSTOM_CARD_PRICE,
    discountPercent: null,
    finalPrice: CUSTOM_CARD_PRICE,
  };
  try {
    const pricing = await serverFetch<Partial<PackagePricing>>("/pricing", {
      revalidate: REVALIDATE.config,
      tags: [CACHE_TAGS.pricing],
    });
    // Một phản hồi 200 sai hình dạng còn tệ hơn lỗi: nó vẽ "NaN ₫" lên trang giá.
    if (
      !Number.isFinite(pricing.price) ||
      !Number.isFinite(pricing.finalPrice)
    ) {
      return fallback;
    }
    return {
      price: pricing.price as number,
      finalPrice: pricing.finalPrice as number,
      discountPercent: pricing.discountPercent ?? null,
    };
  } catch {
    return fallback;
  }
}
