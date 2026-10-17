import "server-only";
import { headers } from "next/headers";
import { PATHNAME_HEADER } from "@/constants/http";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

/**
 * Locale của lượt request hiện tại, suy từ header do `proxy.ts` gắn.
 *
 * Dành riêng cho `not-found.tsx` — file duy nhất trong app cần biết locale mà
 * Next lại không truyền `params` cho. Page bình thường phải lấy `locale` từ
 * `params`, đừng dùng helper này để đi đường tắt.
 */
export async function getRequestLocale(): Promise<Locale> {
  const store = await headers();
  const [, segment] = (store.get(PATHNAME_HEADER) ?? "").split("/");
  return isLocale(segment) ? segment : defaultLocale;
}
