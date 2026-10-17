import { COUPLE_NAMES_LOCK_DAYS } from "@/constants/card";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Mốc tên tự khoá, hoặc `null` khi thiệp chưa từng thanh toán. */
export function coupleNamesLockAt(paidAt: string | null): Date | null {
  return paidAt
    ? new Date(new Date(paidAt).getTime() + COUPLE_NAMES_LOCK_DAYS * DAY_MS)
    : null;
}
