"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTemplateStats,
  getTemplates,
  setHomepageTemplates,
  updateTemplate,
  type QueryTemplatesInput,
  type Template,
  type TemplateStatsDays,
} from "@/apis/catalog";
import { PAGE_SIZE } from "@/constants/pagination";

export const catalogQueryKeys = {
  all: ["catalog"] as const,
  templates: () => [...catalogQueryKeys.all, "templates"] as const,
  templatePage: (input: QueryTemplatesInput) =>
    [...catalogQueryKeys.templates(), input] as const,
  stats: (days: TemplateStatsDays) =>
    [...catalogQueryKeys.all, "stats", days] as const,
};

/* ---------------------------------------------------------------- mẫu thiệp */

/**
 * **Cả kho mẫu trong một lượt**, không phân trang.
 *
 * Hai chỗ dùng nó đều không phân trang được: ô chọn thiệp lọc tại chỗ theo tên
 * để phản hồi tức thì, còn form "mẫu trên trang chủ" phải thấy đủ kho mới sắp
 * được thứ tự. Bảng tag mẫu thì dùng `useTemplatePageQuery` bên dưới.
 */
export function useAllTemplatesQuery() {
  return useQuery({
    queryKey: catalogQueryKeys.templates(),
    queryFn: () => getTemplates(),
  });
}

/**
 * Một trang kho mẫu cho bảng tag mẫu thiệp.
 *
 * Bộ lọc đi kèm request chứ không lọc tại chỗ: lọc trong trang chỉ tìm được
 * trong 20 mẫu đang hiện, và người vận hành sẽ kết luận nhầm là mẫu không tồn
 * tại.
 */
export function useTemplatePageQuery(
  page: number,
  filter: Omit<QueryTemplatesInput, "limit" | "offset"> = {},
) {
  const input: QueryTemplatesInput = {
    ...filter,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };
  return useQuery({
    queryKey: catalogQueryKeys.templatePage(input),
    queryFn: () => getTemplates(input),
    // Giữ trang cũ trong lúc lật hoặc gõ ô tìm: bảng không nháy trắng.
    placeholderData: (previous) => previous,
  });
}

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      input,
    }: {
      slug: string;
      input: Parameters<typeof updateTemplate>[1];
    }) => updateTemplate(slug, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.templates() }),
  });
}

/**
 * Lưu dải trang chủ. Backend trả về dải sau khi lưu, nhưng cache giữ **cả kho
 * mẫu** — mẫu bị gỡ khỏi dải cũng đổi cờ, nên nạp lại toàn bộ thay vì ghép tay
 * kết quả trả về vào danh sách cũ.
 */
export function useSetHomepageTemplatesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slugs: string[]) => setHomepageTemplates(slugs),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.templates() }),
  });
}

/** Màn "Mẫu xem nhiều": lượt mở mẫu, mở demo và thiệp tạo ra trong kỳ. */
export function useTemplateStatsQuery(days: TemplateStatsDays) {
  return useQuery({
    queryKey: catalogQueryKeys.stats(days),
    queryFn: () => getTemplateStats(days),
    placeholderData: (previous) => previous,
  });
}

export type { Template };
