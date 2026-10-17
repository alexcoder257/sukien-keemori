import { z } from "zod";
import { VOUCHER_DISCOUNT_TYPES } from "@/apis/voucher";
import type { AdminErrors } from "./store";

/**
 * Ô số **bỏ trống là một giá trị thật**, không phải lỗi: "không giới hạn lượt",
 * "không có trần giảm", "không hết hạn". `<input type="number">` rỗng cho ra
 * `NaN`, nên nắn về `null` ngay ở đây — để `NaN` lọt xuống thì nó thành `null`
 * trong JSON và backend báo lỗi kiểu, còn người vận hành thì không hiểu vì sao.
 */
function optionalCount(e: AdminErrors) {
  return z
    .union([z.number().int().min(1, e.numberMin), z.nan()])
    .nullable()
    .transform((value) =>
      value === null || Number.isNaN(value) ? null : value,
    );
}

function optionalAmount(e: AdminErrors) {
  return z
    .union([z.number().int().min(0, e.numberMin), z.nan()])
    .nullable()
    .transform((value) =>
      value === null || Number.isNaN(value) ? null : value,
    );
}

/**
 * Mã giảm giá (`components/admin/voucher-table.tsx`).
 *
 * Chỉ có một gói nên không có phạm vi gói hay cửa hàng độc quyền.
 */
export function voucherSchema(e: AdminErrors) {
  return (
    z
      .object({
        code: z
          .string()
          .trim()
          .min(3, e.required)
          .max(32)
          .transform((value) => value.replace(/\s+/g, "").toUpperCase()),
        description: z.string().trim(),
        discountType: z.enum(VOUCHER_DISCOUNT_TYPES),
        discountValue: z.number().int().min(1, e.numberMin),
        maxDiscount: optionalAmount(e),
        minAmount: z.number().int().min(0, e.numberMin),
        startsAt: z.string(),
        expiresAt: z.string(),
        usageLimit: optionalCount(e),
        perUserLimit: optionalCount(e),
        isActive: z.boolean(),
        isPublic: z.boolean(),
      })
      // Kiểm ở đây chứ không chỉ trông vào backend: người vận hành gõ 150 vào ô
      // phần trăm cần thấy lỗi ngay cạnh ô đó, không phải sau một vòng mạng.
      .refine(
        (values) =>
          values.discountType !== "percent" || values.discountValue <= 100,
        { path: ["discountValue"], message: e.percentMax },
      )
  );
}

export type VoucherValues = z.infer<ReturnType<typeof voucherSchema>>;
