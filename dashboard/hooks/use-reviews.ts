"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminTemplateReview,
  getAdminTemplateReviews,
  type QueryTemplateReviewsInput,
} from "@/apis/reviews";

export const templateReviewQueryKeys = {
  all: ["template-reviews"] as const,
  list: (input: QueryTemplateReviewsInput) =>
    [...templateReviewQueryKeys.all, "list", input] as const,
  listRoot: () => [...templateReviewQueryKeys.all, "list"] as const,
};

export function useAdminTemplateReviewsQuery(
  input: QueryTemplateReviewsInput = {},
) {
  return useQuery({
    queryKey: templateReviewQueryKeys.list(input),
    queryFn: () => getAdminTemplateReviews(input),
    // Giữ trang cũ trong lúc gõ ô tìm kiếm hoặc đổi trang: bảng không nháy
    // trắng giữa hai lần tải.
    placeholderData: (previous) => previous,
  });
}

export function useDeleteTemplateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminTemplateReview(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: templateReviewQueryKeys.listRoot(),
      }),
  });
}
