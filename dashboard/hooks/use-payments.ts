"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOrders,
  getUnmatchedTransactions,
  matchTransaction,
  type OrderQuery,
} from "@/apis/payments";
import { PAGE_SIZE } from "@/constants/pagination";

export const paymentQueryKeys = {
  all: ["payments"] as const,
  orders: (input: OrderQuery) =>
    [...paymentQueryKeys.all, "orders", input] as const,
  unmatched: (q: string, page: number) =>
    [...paymentQueryKeys.all, "unmatched", q, page] as const,
};

/** Đơn mua thiệp, lọc và tìm ở backend — tìm phải tính trên toàn bảng. */
export function useAdminOrdersQuery(
  input: Omit<OrderQuery, "limit" | "offset">,
  page = 0,
) {
  const query: OrderQuery = {
    ...input,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };
  return useQuery({
    queryKey: paymentQueryKeys.orders(query),
    queryFn: () => getAdminOrders(query),
    placeholderData: (previous) => previous,
  });
}

/** Hàng đợi tiền vào chưa ghép. */
export function useUnmatchedQuery(q: string, page = 0) {
  return useQuery({
    queryKey: paymentQueryKeys.unmatched(q, page),
    queryFn: () =>
      getUnmatchedTransactions({
        q: q || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });
}

/**
 * Ghép tay một khoản tiền vào đơn. Làm mới **cả hai** tab: khoản vừa ghép rời
 * hàng đợi, còn đơn của nó chuyển sang "Đã thanh toán" kèm khoản tiền đó.
 */
export function useMatchTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentCode }: { id: string; paymentCode: string }) =>
      matchTransaction(id, paymentCode),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.all }),
  });
}
