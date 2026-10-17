import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";

type AuthErrors = Dictionary["auth"]["errors"];

/**
 * Không kiểm độ mạnh mật khẩu ở đây: đó là luật lúc **đặt** mật khẩu, còn đăng
 * nhập chỉ cần gõ đúng thứ đã đặt — kể cả mật khẩu khởi tạo đặt trước luật.
 */
export function loginSchema(e: AuthErrors) {
  return z.object({
    email: z.string().trim().min(1, e.emailRequired).email(e.emailInvalid),
    password: z.string().min(1, e.passwordRequired),
  });
}

export type LoginValues = z.infer<ReturnType<typeof loginSchema>>;
