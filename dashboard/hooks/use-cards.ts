"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminCards,
  getWeddings,
  setCardCoupleNamesLock,
  setCardShowcase,
  type QueryCardsInput,
  type WeddingScope,
} from "@/apis/cards";

export const cardsQueryKeys = {
  all: ["cards"] as const,
  list: (input: QueryCardsInput) =>
    [...cardsQueryKeys.all, "list", input] as const,
  listRoot: () => [...cardsQueryKeys.all, "list"] as const,
  weddings: (scope: WeddingScope, withinDays: number | null, page: number) =>
    [...cardsQueryKeys.all, "weddings", scope, withinDays, page] as const,
};

/**
 * `enabled` để chỗ gọi tắt hẳn truy vấn khi chưa có gì để hỏi — `CardPicker`
 * chỉ tra thiệp đang chọn khi thật sự có một slug trong tay.
 */
export function useAdminCardsQuery(
  input: QueryCardsInput = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: cardsQueryKeys.list(input),
    queryFn: () => getAdminCards(input),
    enabled: options.enabled ?? true,
    // Giữ trang cũ trong lúc gõ ô tìm kiếm hoặc đổi trang: bảng không nháy
    // trắng giữa hai lần tải.
    placeholderData: (previous) => previous,
  });
}

/** Màn "Lịch ngày cưới". `page` đếm từ 0. */
export function useWeddingsQuery(
  scope: WeddingScope,
  withinDays: number | null,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: cardsQueryKeys.weddings(scope, withinDays, page),
    queryFn: () =>
      getWeddings({
        scope,
        withinDays: withinDays ?? undefined,
        limit: pageSize,
        offset: page * pageSize,
      }),
    placeholderData: (previous) => previous,
  });
}

export function useSetCardShowcaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      setCardShowcase(id, value),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cardsQueryKeys.listRoot() }),
  });
}

export function useSetCardCoupleNamesLockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, unlocked }: { id: string; unlocked: boolean }) =>
      setCardCoupleNamesLock(id, unlocked),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cardsQueryKeys.listRoot() }),
  });
}
