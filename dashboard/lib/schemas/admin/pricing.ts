import { z } from "zod";
import type { AdminErrors } from "./store";

/**
 * Bảng giá một gói (`components/admin/price-config-form.tsx`).
 *
 * `discountPercent` bỏ trống là một giá trị thật (`null` = không khuyến mãi).
 * `<input type="number">` rỗng cho ra `NaN`, nên nắn về `null` ngay ở đây.
 */
export function priceConfigSchema(e: AdminErrors) {
  return z.object({
    price: z.number().int(e.numberMin).min(1, e.numberMin),
    discountPercent: z
      .union([
        z.number().int().min(0, e.numberMin).max(100, e.numberMax),
        z.nan(),
      ])
      .nullable()
      .transform((value) =>
        value === null || Number.isNaN(value) ? null : value,
      ),
  });
}

export type PriceConfigValues = z.infer<ReturnType<typeof priceConfigSchema>>;
