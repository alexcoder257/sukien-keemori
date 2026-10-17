import { z } from "zod";

/** `homepage-template-form.tsx` — danh sách mẫu đã chọn (có thứ tự). */
export function homepageTemplateSchema() {
  return z.object({
    selected: z.array(z.string()),
  });
}

export type HomepageTemplateValues = z.infer<
  ReturnType<typeof homepageTemplateSchema>
>;
