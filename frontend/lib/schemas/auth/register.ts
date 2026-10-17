import { z } from "zod";
import {
  PHONE_E164_MAX_DIGITS,
  PHONE_NATIONAL_MIN_DIGITS,
  findPhoneCountry,
  phoneDigits,
} from "@/constants";
import { emailField, strongPassword, type AuthErrors } from "./common";

export function registerSchema(e: AuthErrors) {
  return z
    .object({
      fullName: z.string().trim().min(1, e.fullNameRequired),
      email: emailField(e),
      // Số điện thoại là trường duy nhất không bắt buộc: tài khoản tạo qua
      // Google không có số nào để điền, nên form email cũng không được ép.
      phoneCountry: z.string().min(1),
      phone: z.string().trim(),
      password: strongPassword(e),
      confirm: z.string().min(1, e.passwordRequired),
      terms: z.literal(true, { message: e.termsRequired }),
    })
    .refine((v) => v.password === v.confirm, {
      message: e.confirmMismatch,
      path: ["confirm"],
    })
    .refine(
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

export type RegisterValues = z.infer<ReturnType<typeof registerSchema>>;
