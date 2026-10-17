import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";
import { EMAIL_RE, SPECIAL_RE, PASSWORD_MIN_LENGTH } from "@/constants";

export type AuthErrors = Dictionary["auth"]["errors"];

export const emailField = (e: AuthErrors) =>
  z.string().trim().min(1, e.emailRequired).regex(EMAIL_RE, e.emailInvalid);

// Policy: tối thiểu 8 ký tự, có chữ hoa, chữ thường và ký tự đặc biệt.
export const strongPassword = (e: AuthErrors) =>
  z
    .string()
    .min(PASSWORD_MIN_LENGTH, e.passwordMin)
    .regex(/[a-z]/, e.passwordPolicy)
    .regex(/[A-Z]/, e.passwordPolicy)
    .regex(SPECIAL_RE, e.passwordPolicy);
