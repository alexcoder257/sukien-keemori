import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  PHONE_E164_MAX_DIGITS,
  PHONE_NATIONAL_MIN_DIGITS,
  findPhoneCountry,
  phoneDigits,
} from "@/constants";

export type ProfileErrors = Dictionary["account"]["profile"]["errors"];

export function profileSchema(e: ProfileErrors) {
  return z
    .object({
      fullName: z.string().trim().min(1, e.fullNameRequired).max(255),
      phoneCountry: z.string().min(1),
      // Rỗng = xoá số điện thoại, vẫn hợp lệ.
      phone: z.string().trim(),
    })
    .refine(
      // Cùng luật với form đăng ký (`lib/schemas/auth/register.ts`): số nội địa
      // đủ dài và tổng chữ số kể cả mã vùng không vượt giới hạn E.164.
      (v) => {
        const national = phoneDigits(v.phone).replace(/^0+/, "");
        if (!national) return true;
        const dial = findPhoneCountry(v.phoneCountry).dial;
        return (
          national.length >= PHONE_NATIONAL_MIN_DIGITS &&
          dial.length + national.length <= PHONE_E164_MAX_DIGITS
        );
      },
      { message: e.phoneInvalid, path: ["phone"] },
    );
}

export type ProfileValues = z.infer<ReturnType<typeof profileSchema>>;
