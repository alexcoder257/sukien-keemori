import { z } from "zod";
import { emailField, type AuthErrors } from "./common";

export function loginSchema(e: AuthErrors) {
  return z.object({
    email: emailField(e),
    password: z.string().min(1, e.passwordRequired),
    remember: z.boolean().optional(),
  });
}

export type LoginValues = z.infer<ReturnType<typeof loginSchema>>;
