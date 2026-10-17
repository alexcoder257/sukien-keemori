import { z } from "zod";
import { strongPassword, type AuthErrors } from "./common";

export function resetSchema(e: AuthErrors) {
  return z
    .object({
      password: strongPassword(e),
      confirm: z.string().min(1, e.passwordRequired),
    })
    .refine((v) => v.password === v.confirm, {
      message: e.confirmMismatch,
      path: ["confirm"],
    });
}

export type ResetValues = z.infer<ReturnType<typeof resetSchema>>;
