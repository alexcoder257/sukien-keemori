"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVoucher,
  deleteVoucher,
  getVouchers,
  updateVoucher,
  type Voucher,
  type VoucherInput,
} from "@/apis/voucher";
import { PAGE_SIZE } from "@/constants/pagination";

export const voucherQueryKeys = {
  all: ["voucher"] as const,
  list: () => [...voucherQueryKeys.all, "list"] as const,
  page: (page: number) => [...voucherQueryKeys.list(), page] as const,
};

export function useVouchersQuery(page = 0) {
  return useQuery({
    queryKey: voucherQueryKeys.page(page),
    queryFn: () => getVouchers({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    placeholderData: (previous) => previous,
  });
}

/**
 * Ba mutation, cùng một cách dọn cache: nạp lại cả danh sách.
 *
 * Ghi thẳng vào cache như `useUpdateTierPriceMutation` không đủ ở đây —
 * `usedCount` đổi ở backend mỗi khi có đơn trả tiền, nên một bản ghi dựng lại ở
 * client sẽ hiện số lượt cũ ngay cạnh hạn mức mới.
 */
export function useCreateVoucherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VoucherInput): Promise<Voucher> => createVoucher(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: voucherQueryKeys.list() }),
  });
}

export function useUpdateVoucherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateVoucher>[1];
    }) => updateVoucher(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: voucherQueryKeys.list() }),
  });
}

export function useDeleteVoucherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVoucher(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: voucherQueryKeys.list() }),
  });
}
