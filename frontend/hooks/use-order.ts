"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiError,
  cancelOrder,
  createOrder,
  getAvailableVouchers,
  getQuote,
  previewVoucher,
  type CreateOrderInput,
  type Order,
  type VoucherPreview,
} from "@/apis";
import { cardQueryKeys } from "@/hooks/use-card";
import type { Locale } from "@/i18n/config";
import { paymentQueryKeys } from "./use-payment";

export const orderQueryKeys = {
  all: ["order"] as const,
  quote: () => [...orderQueryKeys.all, "quote"] as const,
  vouchers: () => [...orderQueryKeys.all, "vouchers"] as const,
};

export function useAvailableVouchersQuery(enabled = true) {
  return useQuery({
    queryKey: orderQueryKeys.vouchers(),
    queryFn: getAvailableVouchers,
    enabled,
    staleTime: 0,
    retry: false,
  });
}

/**
 * Giá của gói duy nhất cho người đang đăng nhập.
 *
 * `staleTime` dài: trong một phiên thanh toán, giá không đổi — nó chỉ đổi khi
 * admin sửa bảng giá, và việc đó không xảy ra giữa hai lần mở hộp thanh toán.
 */
export function useQuoteQuery(enabled = true) {
  return useQuery({
    queryKey: orderQueryKeys.quote(),
    queryFn: getQuote,
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * Thử một mã giảm giá.
 *
 * Mutation chứ không query: người dùng bấm "Áp dụng" mới gọi, và mỗi lần gõ lại
 * mã là một lượt thử mới — cache theo mã chỉ khiến một mã vừa hết lượt vẫn hiện
 * "đã giảm" cho tới khi hết `staleTime`.
 *
 * Lỗi **không** đẩy ra toast: hộp chọn mã hiện lý do ngay dưới ô nhập
 * (`error.message`), vì mã sai là thứ người dùng sửa tại chỗ chứ không phải một
 * sự cố cần báo ở góc màn hình.
 */
export function usePreviewVoucherMutation() {
  return useMutation({
    mutationFn: (code: string): Promise<VoucherPreview> => previewVoucher(code),
  });
}

/** Tạo đơn cho một thiệp. */
export function useCreateOrderMutation() {
  return useMutation({
    mutationFn: (input: CreateOrderInput): Promise<Order> => createOrder(input),
  });
}

/**
 * Tạo đơn rồi đưa người dùng sang màn chuyển khoản của chính đơn đó. Đơn 0 ₫
 * (mã giảm 100%) đã `paid` ngay lúc tạo; màn chuyển khoản thấy trạng thái đó và
 * báo thành công luôn.
 */
export function useStartCheckout({
  locale,
  messages,
  onCreated,
}: {
  locale: Locale;
  onCreated?: (order: Order) => void;
  /** `failed` cho lỗi không đọc được. */
  messages: { failed: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createOrder = useCreateOrderMutation();

  const start = async (input: CreateOrderInput) => {
    try {
      const order = await createOrder.mutateAsync(input);
      // Thiệp vừa có đơn (`pendingOrderId`) hoặc vừa được xuất bản (đơn 0 ₫).
      void queryClient.invalidateQueries({ queryKey: cardQueryKeys.all });

      // Không đóng hộp bằng tay: điều hướng làm cả màn hình đổi, đóng trước chỉ
      // tạo một nhịp chớp trắng giữa hai trang.
      if (onCreated) onCreated(order);
      else router.push(`/${locale}/thanh-toan/${order.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : messages.failed);
    }
  };

  return { start, isPending: createOrder.isPending };
}

/**
 * Huỷ đơn đang chờ — lối ra khi khách đổi ý giữa màn chuyển khoản.
 *
 * Dọn luôn cache checkout của đúng đơn đó: giữ lại thì màn thanh toán vẫn còn
 * hiện QR của một đơn đã không còn nhận tiền nữa. Danh sách thiệp cũng cũ vì
 * `pendingOrderId` không còn đúng.
 */
export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (_order, orderId) => {
      queryClient.removeQueries({
        queryKey: paymentQueryKeys.checkout(orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.all });
    },
  });
}
