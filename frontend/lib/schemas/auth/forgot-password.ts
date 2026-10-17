import { z } from "zod";
import { emailField, type AuthErrors } from "./common";

export function forgotSchema(e: AuthErrors) {
  return z.object({ email: emailField(e) });
}

export type ForgotValues = z.infer<ReturnType<typeof forgotSchema>>;
