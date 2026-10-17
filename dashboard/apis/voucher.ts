"use client";

import { pageQuery, type PageInput, type Paged } from "./pagination";
import { request } from "./http";

/** Trừ phần trăm hay trừ thẳng một số tiền. Không có loại thứ ba. */
export const VOUCHER_DISCOUNT_TYPES = ["percent", "amount"] as const;
export type VoucherDiscountType = (typeof VOUCHER_DISCOUNT_TYPES)[number];

export interface Voucher {
  id: string;
  code: string;
  description: string | null;
  discountType: VoucherDiscountType;
  /** Phần trăm (0–100) hoặc số tiền VND, tuỳ `discountType`. */
  discountValue: number;
  /** Trần số tiền được giảm; chỉ có nghĩa với mã phần trăm. */
  maxDiscount: number | null;
  /**
   * Di sản: chỉ còn một gói nên backend bỏ qua phạm vi này. Luôn gửi `[]`.
   */
  tiers: string[];
  minAmount: number;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  /** Số lượt **đã trả tiền xong**, không phải số đơn đã tạo. */
  usedCount: number;
  perUserLimit: number | null;
  isActive: boolean;
  isPublic: boolean;
  /** Di sản của chương trình đối tác đã gỡ; luôn `null`, luôn gửi `null`. */
  partnerStoreId: string | null;
  createdAt: string;
}

export type VoucherInput = Omit<
  Voucher,
  "id" | "usedCount" | "createdAt"
>;

/** Mã giảm giá cần quyền `vouchers:manage`; backend trả 403 nếu thiếu. */
export function getVouchers(page: PageInput = {}): Promise<Paged<Voucher>> {
  return request<Paged<Voucher>>(`/admin/vouchers${pageQuery(page)}`);
}

export function createVoucher(input: VoucherInput): Promise<Voucher> {
  return request<Voucher>("/admin/vouchers", { method: "POST", body: input });
}

/**
 * `code` không nằm trong danh sách sửa được: mã đã phát ra ngoài thì đổi chữ là
 * làm chết mọi tờ rơi và tin nhắn đã gửi đi. Cần mã khác thì tắt mã cũ, tạo mã
 * mới.
 */
export function updateVoucher(
  id: string,
  input: Partial<Omit<VoucherInput, "code">>,
): Promise<Voucher> {
  return request<Voucher>(`/admin/vouchers/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteVoucher(id: string): Promise<void> {
  return request<void>(`/admin/vouchers/${id}`, { method: "DELETE" });
}
