"use client";

import { pageQuery, type PageInput, type Paged } from "./pagination";
import { request } from "./http";

export type MatchStatus =
  | "matched"
  | "unmatched"
  | "manual"
  | "underpaid"
  | "ignored";

/**
 * Một khoản **tiền vào** như khu quản trị nhìn thấy. Backend không trả payload
 * gốc của SePay (tên và số tài khoản người gửi) — màn tra soát không cần nó.
 */
export interface PaymentTransaction {
  id: string;
  sepayId: string;
  orderId: string | null;
  matchStatus: MatchStatus;
  /** Ngân hàng và số tài khoản **nhận** tiền (tài khoản của Keemori). */
  gateway: string;
  accountNumber: string;
  /** Backend trả `bigint` nên số tiền về dạng chuỗi. */
  transferAmount: string;
  content: string;
  paymentCode: string | null;
  referenceCode: string | null;
  transactionDate: string;
}

export type OrderStatus = "pending" | "paid" | "cancelled";

/** Một đơn mua thiệp kèm tiền vào đã ghép — màn tra cứu thanh toán. */
export interface AdminOrder {
  id: string;
  paymentCode: string | null;
  status: OrderStatus;
  amount: number;
  listAmount: number;
  discountAmount: number;
  voucherCode: string | null;
  gatewayReference: string | null;
  createdAt: string;
  paidAt: string | null;
  /** `null` khi tài khoản đã xoá thật — đơn sống lâu hơn tài khoản. */
  user: { id: string; email: string; fullName: string } | null;
  /** `null` khi thiệp đã bị xoá. */
  card: { id: string; slug: string; title: string } | null;
  transactions: PaymentTransaction[];
}

export interface OrderQuery extends PageInput {
  /** Mã đơn, email, họ tên, đường dẫn thiệp, mã voucher, mã tham chiếu NH. */
  q?: string;
  status?: OrderStatus;
  /** `YYYY-MM-DD`, theo ngày Việt Nam, gồm cả hai đầu. */
  from?: string;
  to?: string;
}

/** Danh sách đơn kèm tổng của **mọi** đơn khớp bộ lọc, không riêng trang này. */
export interface AdminOrderPage extends Paged<AdminOrder> {
  summary: { paidCount: number; paidAmount: number };
}

function withQuery(page: PageInput, extra: Record<string, string | undefined>) {
  const params = new URLSearchParams(pageQuery(page).replace(/^\?/, ""));
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getAdminOrders(input: OrderQuery = {}): Promise<AdminOrderPage> {
  const { q, status, from, to, ...page } = input;
  return request<AdminOrderPage>(
    `/admin/payments/orders${withQuery(page, { q, status, from, to })}`,
  );
}

/** Tiền vào đã về mà chưa gắn được vào đơn nào — hàng đợi tra soát. */
export function getUnmatchedTransactions(
  input: PageInput & { q?: string } = {},
): Promise<Paged<PaymentTransaction>> {
  const { q, ...page } = input;
  return request<Paged<PaymentTransaction>>(
    `/admin/payments/unmatched${withQuery(page, { q })}`,
  );
}

/**
 * Ghép tay một khoản tiền vào mồ côi vào đơn có **mã đơn** này.
 *
 * Đi qua đúng `markPaid` như webhook, nên thao tác này **xuất bản thiệp thật**
 * chứ không chỉ dán nhãn trong sổ cái.
 */
export function matchTransaction(
  id: string,
  paymentCode: string,
): Promise<PaymentTransaction> {
  return request<PaymentTransaction>(
    `/admin/payments/transactions/${id}/match`,
    { method: "POST", body: { paymentCode } },
  );
}
