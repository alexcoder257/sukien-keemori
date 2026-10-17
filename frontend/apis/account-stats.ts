"use client";

import { request } from "./http";

/** Số liệu cho thẻ hồ sơ trang tài khoản. */
export interface AccountStats {
  cards: number;
  views: number;
  wishes: number;
}

/**
 * Gom hai endpoint số liệu (thiệp/lượt xem của `cards`, tổng lời chúc của
 * `wishes`) thành một lời gọi cho trang tài khoản.
 */
export async function getAccountStats(): Promise<AccountStats> {
  const [cardStats, wishCount] = await Promise.all([
    request<{ cards: number; views: number }>("/cards/stats", {
      method: "GET",
    }),
    request<{ wishes: number }>("/wishes/count", { method: "GET" }),
  ]);
  return { ...cardStats, ...wishCount };
}
