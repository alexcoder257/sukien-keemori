import { z } from "zod";
import type { AdminErrors } from "./store";

/** Khớp `FaqInput` ở `apis/content.ts` — một bản ghi mang cả hai ngôn ngữ. */
export function faqSchema(e: AdminErrors) {
  return z.object({
    questionVi: z.string().trim().min(1, e.required),
    answerVi: z.string().trim().min(1, e.required),
    questionEn: z.string().trim().min(1, e.required),
    answerEn: z.string().trim().min(1, e.required),
    // Không `min(1)`: ô này tuỳ chọn, và FAQ nào câu hỏi đã trùng lời khách thì
    // không cần điền gì thêm.
    sortOrder: z.number().int().min(0, e.numberMin),
    isPublished: z.boolean(),
  });
}

export type FaqValues = z.infer<ReturnType<typeof faqSchema>>;
