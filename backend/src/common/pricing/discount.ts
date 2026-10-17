/**
 * Phép trừ tiền dùng chung cho **hai** loại khuyến mãi: phần trăm giảm giá của
 * gói (`tier_prices.discount_percent`) và mã giảm giá (`vouchers`).
 *
 * Tách ra một chỗ vì hai đường đó cộng dồn lên nhau — voucher tính trên giá
 * **đã** trừ khuyến mãi gói — nên chúng phải làm tròn giống hệt nhau, nếu không
 * số hiện ở hộp thanh toán và số chốt vào đơn sẽ lệch vài đồng và người dùng
 * chuyển khoản thiếu.
 *
 * Bản sao ở `frontend/lib/pricing.ts` chỉ để **hiển thị** trang bảng giá; số
 * thật luôn do backend chốt lúc tạo đơn.
 */

/** Trần phần trăm: 100% đã là cho không, cao hơn nữa là trả tiền cho khách. */
export const MAX_DISCOUNT_PERCENT = 100;

/**
 * Giá sau khi trừ `percent` phần trăm. `null`/`0` trả lại nguyên giá — đó cũng
 * là cách "không cấu hình khuyến mãi" được biểu diễn.
 *
 * Làm tròn **lên** bội số 1.000₫: khách chuyển khoản gõ tay số tiền, mà
 * `47.600₫` thì dễ gõ nhầm hơn `48.000₫`. Chọn chiều lên chứ không xuống vì
 * phần lẻ luôn về phía nhà bán — làm tròn xuống thì mỗi đơn khuyến mãi rơi mất
 * tới 999₫ mà không ai chủ ý giảm chỗ đó. Số nhỏ hơn 1.000₫ thì làm tròn lên
 * đến đồng, vì kéo nó lên 1.000₫ có thể vượt quá chính giá gốc.
 */
export function applyPercent(amount: number, percent?: number | null): number {
  if (!percent || percent <= 0) return amount;
  const capped = Math.min(percent, MAX_DISCOUNT_PERCENT);
  const discounted = (amount * (100 - capped)) / 100;
  if (discounted < 1000) return Math.max(0, Math.ceil(discounted));
  return Math.ceil(discounted / 1000) * 1000;
}

/** Trừ thẳng một số tiền, không bao giờ để giá âm. */
export function applyAmount(amount: number, off: number): number {
  return Math.max(0, amount - Math.max(0, off));
}
