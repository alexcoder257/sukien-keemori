"use client";

import { request } from "./http";

/** Gói thiệp custom duy nhất. `finalPrice` đã trừ khuyến mãi của gói. */
export interface Pricing {
  price: number;
  /** `null` là không chạy khuyến mãi. */
  discountPercent: number | null;
  finalPrice: number;
}

export type PricingInput = Pick<Pricing, "price" | "discountPercent">;

export function getPricing(): Promise<Pricing> {
  return request<Pricing>("/pricing", { auth: false });
}

/** Cần quyền `pricing:manage`; backend trả 403 nếu thiếu. */
export function updatePricing(input: PricingInput): Promise<Pricing> {
  return request<Pricing>("/admin/pricing", { method: "PATCH", body: input });
}
