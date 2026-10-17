"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWish,
  deleteWish,
  getCardWishes,
  setWishApproved,
  type CreateWishInput,
} from "@/apis";
import type { Wish } from "@/lib/schemas/invitation";

export const wishQueryKeys = {
  all: ["wishes"] as const,
  card: (cardId: string) => [...wishQueryKeys.all, "card", cardId] as const,
};

/**
 * Khách mời gửi lời chúc.
 *
 * Không có cache nào để cập nhật sau khi gửi: lời chúc mới ở trạng thái chờ
 * duyệt, mà thiệp chỉ vẽ bản đã duyệt. Chèn nó vào danh sách ngay là hứa với
 * khách một trạng thái không có thật.
 */
export function useCreateWishMutation(slug: string) {
  return useMutation({
    mutationFn: (input: CreateWishInput) => createWish(slug, input),
  });
}

/**
 * Danh sách kiểm duyệt của chủ thiệp — gồm cả bản chờ duyệt.
 *
 * `initialData` để trang server-render truyền sẵn danh sách đã nạp: màn hình
 * không nhấp nháy một khung rỗng, nhưng mọi thay đổi sau đó vẫn đi qua cache
 * của React Query.
 */
export function useCardWishesQuery(
  cardId: string | undefined,
  initialData?: Wish[],
) {
  return useQuery({
    queryKey: wishQueryKeys.card(cardId ?? ""),
    queryFn: () => getCardWishes(cardId as string),
    enabled: !!cardId,
    initialData,
  });
}

/**
 * Duyệt hoặc ẩn một lời chúc.
 *
 * Cập nhật lạc quan: nút nằm ngay cạnh dòng lời chúc và chủ thiệp thường bấm
 * liên tiếp nhiều dòng, nên chờ mạng xong mới đổi trạng thái là thấy giật.
 * Hỏng thì trả lại đúng ảnh chụp trước đó.
 */
export function useSetWishApprovedMutation(cardId: string) {
  const queryClient = useQueryClient();
  const queryKey = wishQueryKeys.card(cardId);

  return useMutation({
    mutationFn: ({ wishId, approved }: { wishId: string; approved: boolean }) =>
      setWishApproved(cardId, wishId, approved),
    onMutate: async ({ wishId, approved }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Wish[]>(queryKey);
      queryClient.setQueryData<Wish[]>(queryKey, (wishes) =>
        wishes?.map((wish) =>
          wish.id === wishId ? { ...wish, approved } : wish,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });
}

/** Xoá hẳn một lời chúc. Cùng lối cập nhật lạc quan như duyệt/ẩn. */
export function useDeleteWishMutation(cardId: string) {
  const queryClient = useQueryClient();
  const queryKey = wishQueryKeys.card(cardId);

  return useMutation({
    mutationFn: (wishId: string) => deleteWish(cardId, wishId),
    onMutate: async (wishId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Wish[]>(queryKey);
      queryClient.setQueryData<Wish[]>(queryKey, (wishes) =>
        wishes?.filter((wish) => wish.id !== wishId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });
}
