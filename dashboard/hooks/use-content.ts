"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Paged, PageInput } from "@/apis/pagination";
import {
  createCoupleShowcase,
  createFaq,
  deleteCoupleShowcase,
  deleteFaq,
  getCoupleShowcases,
  getFaqs,
  getSiteStats,
  reorderCoupleShowcases,
  updateCoupleShowcase,
  updateFaq,
  updateSiteStats,
  type CoupleShowcase,
  type CoupleShowcaseInput,
  type FaqInput,
  type SiteStat,
} from "@/apis/content";

/**
 * Khoá của danh sách có phân trang mang luôn số trang: hai trang là hai kết quả
 * khác nhau, gộp chung một khoá thì lật trang xong quay lại trang cũ sẽ đọc ra
 * dữ liệu của trang mới.
 *
 * `invalidateQueries` sau mỗi mutation vẫn nhắm vào khoá **gốc** (không có số
 * trang) để mọi trang đã cache cùng hết hạn — thêm một dòng ở trang 1 thì trang
 * 2 cũng đã khác.
 */
export const contentQueryKeys = {
  all: ["content"] as const,
  faqs: () => [...contentQueryKeys.all, "faqs"] as const,
  faqPage: (page: number) => [...contentQueryKeys.faqs(), page] as const,
  coupleShowcases: () => [...contentQueryKeys.all, "couple-showcases"] as const,
  coupleShowcaseList: () =>
    [...contentQueryKeys.coupleShowcases(), "all"] as const,
  siteStats: () => [...contentQueryKeys.all, "site-stats"] as const,
};

/** Trang thứ `page` (0-index) quy về `limit`/`offset` của backend. */
function pageInput(page: number): PageInput {
  return { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
}

/* -------------------------------------------------------------------- FAQ */

export function useFaqsQuery(page = 0) {
  return useQuery({
    queryKey: contentQueryKeys.faqPage(page),
    queryFn: () => getFaqs(pageInput(page)),
    placeholderData: (previous) => previous,
  });
}

/**
 * Ba mutation của FAQ dùng chung một `onSuccess`: mọi thao tác đều đổi thứ tự
 * hoặc số lượng của cả danh sách, nên nạp lại cả danh sách là đúng — cập nhật
 * lẻ từng dòng sẽ để `sortOrder` của các dòng khác cũ đi.
 */
export function useCreateFaqMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FaqInput) => createFaq(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.faqs() }),
  });
}

export function useUpdateFaqMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FaqInput> }) =>
      updateFaq(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.faqs() }),
  });
}

export function useDeleteFaqMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFaq(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.faqs() }),
  });
}

/* ------------------------------------------------------------- site stats */

export function useSiteStatsQuery() {
  return useQuery({
    queryKey: contentQueryKeys.siteStats(),
    queryFn: getSiteStats,
  });
}

export function useUpdateSiteStatsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stats: SiteStat[]) => updateSiteStats(stats),
    // Backend trả về đúng dải vừa lưu, nên ghi thẳng vào cache: form nạp lại từ
    // đó và `isDirty` về `false` mà không cần một vòng refetch.
    onSuccess: (data) =>
      queryClient.setQueryData(contentQueryKeys.siteStats(), data),
  });
}

/* --------------------------------------------------- couple showcase (home) */

/**
 * Cả dải trong một lượt, không phân trang: thứ tự được sắp bằng kéo thả, mà
 * kéo một ô từ trang 2 lên đầu trang 1 thì không làm được. Dải trang chủ chỉ
 * có vài chục ô, xa dưới trần 200 của backend.
 */
export function useCoupleShowcasesQuery() {
  return useQuery({
    queryKey: contentQueryKeys.coupleShowcaseList(),
    queryFn: () => getCoupleShowcases(),
  });
}

/**
 * Ba mutation dùng chung một `onSuccess`, cùng lý do như FAQ: mọi thao tác đều
 * đổi thứ tự hoặc số lượng của cả dải, nên nạp lại cả danh sách.
 */
export function useCreateCoupleShowcaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CoupleShowcaseInput) => createCoupleShowcase(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.coupleShowcases(),
      }),
  });
}

export function useUpdateCoupleShowcaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CoupleShowcaseInput>;
    }) => updateCoupleShowcase(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.coupleShowcases(),
      }),
  });
}

/**
 * Kéo thả cập nhật bảng **trước** khi backend trả lời: chờ một vòng request
 * thì ô vừa thả nảy về chỗ cũ rồi mới nhảy sang chỗ mới. Hỏng thì trả bảng về
 * như trước khi kéo; xong thì vẫn nạp lại để khớp số thứ tự backend đã ghi.
 */
export function useReorderCoupleShowcasesMutation() {
  const queryClient = useQueryClient();
  const queryKey = contentQueryKeys.coupleShowcaseList();
  return useMutation({
    mutationFn: (ids: string[]) => reorderCoupleShowcases(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<Paged<CoupleShowcase>>(queryKey);
      if (previous) {
        const byId = new Map(previous.items.map((item) => [item.id, item]));
        queryClient.setQueryData<Paged<CoupleShowcase>>(queryKey, {
          ...previous,
          items: ids.flatMap((id, index) => {
            const item = byId.get(id);
            return item ? [{ ...item, sortOrder: index + 1 }] : [];
          }),
        });
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.coupleShowcases(),
      }),
  });
}

export function useDeleteCoupleShowcaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCoupleShowcase(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.coupleShowcases(),
      }),
  });
}
