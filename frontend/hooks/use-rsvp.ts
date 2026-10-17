"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteRsvp,
  getCardRsvps,
  submitRsvp,
  type SubmitRsvpInput,
} from "@/apis";
import type { Rsvp } from "@/lib/schemas/invitation";

export const rsvpQueryKeys = {
  all: ["rsvps"] as const,
  card: (cardId: string) => [...rsvpQueryKeys.all, "card", cardId] as const,
};

/**
 * Khách gửi xác nhận tham dự. Không có cache nào để cập nhật: trang thiệp không
 * đọc lại phản hồi của ai, còn danh sách của chủ thiệp nằm trên máy khác.
 */
export function useSubmitRsvpMutation(slug: string) {
  return useMutation({
    mutationFn: (input: SubmitRsvpInput) => submitRsvp(slug, input),
  });
}

/** Danh sách phản hồi của chủ thiệp; `initialData` cùng lý do với lời chúc. */
export function useCardRsvpsQuery(
  cardId: string | undefined,
  initialData?: Rsvp[],
) {
  return useQuery({
    queryKey: rsvpQueryKeys.card(cardId ?? ""),
    queryFn: () => getCardRsvps(cardId as string),
    enabled: !!cardId,
    initialData,
  });
}

/** Xoá một phản hồi, cập nhật lạc quan và trả lại ảnh chụp cũ khi hỏng. */
export function useDeleteRsvpMutation(cardId: string) {
  const queryClient = useQueryClient();
  const queryKey = rsvpQueryKeys.card(cardId);

  return useMutation({
    mutationFn: (rsvpId: string) => deleteRsvp(cardId, rsvpId),
    onMutate: async (rsvpId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Rsvp[]>(queryKey);
      queryClient.setQueryData<Rsvp[]>(queryKey, (rsvps) =>
        rsvps?.filter((rsvp) => rsvp.id !== rsvpId),
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
