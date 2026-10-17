import { z } from "zod";
import type { AdminErrors } from "./store";
import { SHOWCASE_KINDS } from "@/constants/showcase";

/**
 * Một ô trong dải "Cặp đôi đã tạo thiệp".
 *
 * `imageSrc` bắt buộc bắt đầu bằng `/` — cùng luật với
 * `CreateCoupleShowcaseDto` ở backend: đường dẫn tương đối để đổi tên miền hay
 * lên CDN không phải backfill dữ liệu đã ghi.
 */
export function coupleShowcaseSchema(e: AdminErrors) {
  return z.object({
    slug: z.string().trim().min(1, e.required).max(60),
    kind: z.enum(SHOWCASE_KINDS),
    names: z.string().trim().min(1, e.required).max(120),
    weddingDate: z.string().trim().min(1, e.required).max(30),
    imageSrc: z
      .string()
      .trim()
      .min(1, e.required)
      .max(255)
      .refine((value) => value.startsWith("/"), e.relativePath),
    /** Rỗng là "suy từ `imageSrc`" — gửi lên backend thành `null`. */
    posterSrc: z
      .string()
      .trim()
      .max(255)
      .refine((value) => !value || value.startsWith("/"), e.relativePath),
    imagePosition: z.string().trim().max(30),
    sortOrder: z.number().int().min(0, e.numberMin),
    isPublished: z.boolean(),
  });
}

export type CoupleShowcaseValues = z.infer<
  ReturnType<typeof coupleShowcaseSchema>
>;
