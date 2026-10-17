import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";

type PasswordErrors = Dictionary["admin"]["account"]["password"]["errors"];

/**
 * Luật độ mạnh chỉ sống ở đây: backend nhận SHA-256 nên không đọc được mật
 * khẩu gốc để kiểm — cùng cách với luồng đặt mật khẩu của trang khách.
 */
export function changePasswordSchema(e: PasswordErrors) {
  return z
    .object({
      currentPassword: z.string().min(1, e.required),
      newPassword: z
        .string()
        .min(8, e.weak)
        .regex(/[a-z]/, e.weak)
        .regex(/[A-Z]/, e.weak)
        .regex(/\d/, e.weak),
      confirm: z.string().min(1, e.required),
    })
    .refine((v) => v.newPassword === v.confirm, {
      message: e.mismatch,
      path: ["confirm"],
    })
    .refine((v) => v.newPassword !== v.currentPassword, {
      message: e.same,
      path: ["newPassword"],
    });
}

export type ChangePasswordValues = z.infer<
  ReturnType<typeof changePasswordSchema>
>;
