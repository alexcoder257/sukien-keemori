"use server";

import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@/i18n/config";
import { hasSession } from "@/lib/data/session";

/** Xoá bản render cũ trước khi rời màn thanh toán về danh sách thiệp. */
export async function revalidateInvitationPages(locale: Locale): Promise<void> {
  if (!isLocale(locale) || !(await hasSession())) {
    throw new Error("Invalid session");
  }

  revalidatePath(`/${locale}/thiep-cua-toi`);
}
