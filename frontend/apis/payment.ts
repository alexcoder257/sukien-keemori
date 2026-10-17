"use client";

import { request } from "./http";

export type OrderStatus = "pending" | "paid" | "cancelled";

export interface CheckoutInfo {
  orderId: string;
  status: OrderStatus;
  /** Thiệp mà đơn này mở link — màn thanh toán dẫn về đúng thiệp đó. */
  cardId: string | null;
  /** Đường dẫn công khai của thiệp; chỉ có khi đơn đã trả và thiệp đã xuất bản. */
  cardSlug: string | null;
  /** Số tiền phải chuyển, VND. Đã chốt lúc tạo đơn, không đổi theo bảng giá. */
  amount: number;
  /**
   * Mã đơn phải xuất hiện trong nội dung chuyển khoản. QR đã nhúng sẵn, nhưng
   * màn thanh toán vẫn phải hiện nó ra kèm nút copy cho người chuyển bằng tay.
   */
  paymentCode: string;
  accountNumber: string;
  accountName: string;
  /** Tên hoặc mã ngắn của ngân hàng nhận. */
  bankCode: string;
  /** Ảnh QR VietQR, nhúng thẳng bằng `<img>`. */
  qrImageUrl: string;
  /**
   * Mốc màn thanh toán ngừng chờ, ISO. Backend tính từ lúc tạo đơn nên F5 không
   * kéo dài thêm giờ.
   *
   * **Đây là hạn của màn hình, không phải hạn của đơn**: hết giờ thì đơn vẫn
   * `pending` và tiền chuyển muộn vẫn ghép đúng đơn đó. Thiếu thì màn hình
   * không bao giờ tự ngừng chờ.
   */
  holdExpiresAt: string | null;
  /**
   * Lúc tiền được ghi nhận, ISO; `null` khi đơn chưa trả. Dùng để biết đơn
   * **vừa** trả xong hay đang được mở lại để tra cứu.
   */
  paidAt: string | null;
}

/**
 * Hình dạng backend trả. Chấp nhận cả dạng phẳng (`bankCode`, `qrImageUrl`) lẫn
 * dạng lồng (`bank`, `qrUrl`) rồi chuẩn hoá về `CheckoutInfo` ngay ở biên API,
 * để phần còn lại của app chỉ biết một hình dạng.
 */
interface CheckoutResponse extends Partial<CheckoutInfo> {
  orderId: string;
  status: OrderStatus;
  amount: number;
  paymentCode: string;
  bank?: {
    bin?: string;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
  };
  qrUrl?: string;
}

function normalizeCheckout(raw: CheckoutResponse): CheckoutInfo {
  return {
    orderId: raw.orderId,
    status: raw.status,
    cardId: raw.cardId ?? null,
    cardSlug: raw.cardSlug ?? null,
    amount: raw.amount,
    paymentCode: raw.paymentCode,
    accountNumber: raw.accountNumber ?? raw.bank?.accountNumber ?? "",
    accountName: raw.accountName ?? raw.bank?.accountName ?? "",
    bankCode: raw.bankCode ?? raw.bank?.bankName ?? raw.bank?.bin ?? "",
    qrImageUrl: raw.qrImageUrl ?? raw.qrUrl ?? "",
    holdExpiresAt: raw.holdExpiresAt ?? null,
    paidAt: raw.paidAt ?? null,
  };
}

/** Thông tin thanh toán của một đơn — chỉ chủ đơn gọi được. */
export async function getCheckoutInfo(orderId: string): Promise<CheckoutInfo> {
  const raw = await request<CheckoutResponse>(
    `/payments/checkout/${orderId}`,
    { method: "GET" },
  );
  return normalizeCheckout(raw);
}
