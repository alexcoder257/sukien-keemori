"use client";

import { request } from "./http";
import type { OrderStatus } from "./payment";

/**
 * Báo giá của gói duy nhất: giá niêm yết, khuyến mãi gói (nếu có) và số tiền
 * phải trả trước khi áp mã giảm giá.
 */
export interface Quote {
  listAmount: number;
  /** Khuyến mãi gói đang chạy, phần trăm; `0` hoặc `null` là không có. */
  discountPercent: number | null;
  /** Giá sau khuyến mãi gói. */
  amount: number;
}

/**
 * Kết quả thử một mã giảm giá. Backend tự tra giá cho chính người đang đăng
 * nhập — client **không** gửi số tiền lên, nếu không thì khách khai một con số
 * to rồi lấy về một mức giảm không có thật.
 */
export interface VoucherPreview {
  voucherCode: string;
  /** Giá niêm yết. */
  listAmount: number;
  discountAmount: number;
  /** Số phải trả sau khi trừ mã (và khuyến mãi gói). */
  amount: number;
}

export interface CheckoutVoucher {
  code: string;
  description: string | null;
  discountType: "percent" | "amount";
  discountValue: number;
  /** Số tiền mã này giảm cho đơn hiện tại. */
  discountAmount: number;
  available: boolean;
  /**
   * Mã lý do không dùng được (`minimum` | `user-limit`) — chỉ có khi
   * `available` là `false`. Câu chữ hiển thị nằm ở từ điển.
   */
  reason?: string;
  /** Giá trị đơn tối thiểu của mã, cho câu "Đơn tối thiểu …". */
  minAmount?: number | null;
  expiresAt?: string | null;
}

export interface Order {
  id: string;
  cardId: string | null;
  status: OrderStatus;
  amount: number;
  /** Giá niêm yết, trước khuyến mãi gói và mã giảm giá. */
  listAmount: number;
  /** Mã giảm giá đã trừ bao nhiêu; `0` cho đơn không dùng mã. */
  discountAmount: number;
  /** Chữ của mã đã dùng, giữ lại cho biên nhận kể cả khi mã bị xoá. */
  voucherCode: string | null;
  /** Mã trong nội dung chuyển khoản. */
  paymentCode: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CreateOrderInput {
  cardId: string;
  /** Mã giảm giá khách đã áp ở hộp thanh toán. */
  voucherCode?: string;
  /** Văn bản khách đã chấp thuận ngay lúc mua, kèm phiên bản họ nhìn thấy. */
  acceptedDocuments: Array<{ type: string; version: string }>;
}

export function getQuote(): Promise<Quote> {
  return request<Quote>("/orders/quote", { method: "GET" });
}

/**
 * Các mã công khai khách có thể chọn. `POST` dù không ghi gì, cùng kiểu với
 * `previewVoucher`.
 */
export function getAvailableVouchers(): Promise<CheckoutVoucher[]> {
  return request<CheckoutVoucher[]>("/orders/available-vouchers", {
    method: "POST",
    body: {},
  });
}

/**
 * Thử một mã trước khi tạo đơn. `POST` dù không ghi gì: mã nằm trong body thay
 * vì trên URL nên nó không trôi vào access log — mã giảm giá dùng được ngay khi
 * biết chữ.
 */
export function previewVoucher(code: string): Promise<VoucherPreview> {
  return request<VoucherPreview>("/orders/voucher-preview", {
    method: "POST",
    body: { code },
  });
}

/**
 * Tạo đơn cho một thiệp. Gọi lại với đúng thiệp là **vô hại**: backend trả lại
 * chính đơn đang chờ thay vì tạo đơn thứ hai, nên người dùng quay lại màn thanh
 * toán vẫn thấy đúng mã cũ. Đơn 0 ₫ được chốt `paid` ngay.
 */
export function createOrder(input: CreateOrderInput): Promise<Order> {
  return request<Order>("/orders", { method: "POST", body: input });
}

export function cancelOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/cancel`, { method: "POST" });
}
