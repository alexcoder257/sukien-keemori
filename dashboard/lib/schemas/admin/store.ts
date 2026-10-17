import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";

export type AdminErrors = Dictionary["admin"]["errors"];

/** `dashboard/components/admin/site-settings-form.tsx`. */
export function siteSettingsFormSchema(e: AdminErrors) {
  return z.object({
    // Ô trống là hợp lệ: bỏ trống nghĩa là gỡ nút chat khỏi trang khách.
    messengerUrl: z.union([z.literal(""), z.url(e.urlInvalid)]),
    // Cùng luật cho hàng biểu tượng ở chân trang: trống là ẩn biểu tượng đó.
    facebookUrl: z.union([z.literal(""), z.url(e.urlInvalid)]),
    instagramUrl: z.union([z.literal(""), z.url(e.urlInvalid)]),
    tiktokUrl: z.union([z.literal(""), z.url(e.urlInvalid)]),
    // Bỏ dấu cách/chấm/gạch trước khi kiểm, cùng luật với backend: người vận
    // hành hay dán số đã nhóm sẵn ("0358 465 162").
    zaloPhone: z
      .string()
      .transform((value) => value.replace(/[\s.-]/g, ""))
      .pipe(z.union([z.literal(""), z.string().regex(/^0\d{9}$/, e.phoneInvalid)])),
    contactEmail: z.union([z.literal(""), z.email(e.emailInvalid)]),
  });
}

export type SiteSettingsFormValues = z.infer<
  ReturnType<typeof siteSettingsFormSchema>
>;
