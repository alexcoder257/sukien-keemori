"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { autocompletePlaces } from "@/apis";

export const placeQueryKeys = {
  all: ["places"] as const,
  autocomplete: (q: string) => [...placeQueryKeys.all, "autocomplete", q] as const,
};

/**
 * Dưới ngưỡng này gợi ý gần như vô nghĩa mà vẫn tính tiền. Backend chặn ở cùng
 * con số — chỗ này chỉ để khỏi gửi đi một request chắc chắn bị từ chối.
 */
export const PLACE_QUERY_MIN_LENGTH = 3;
/**
 * Người gõ nhanh tạo ra hàng chục lần render mỗi giây; chờ hết một nhịp ngừng
 * tay rồi mới hỏi. Đây là lớp tiết kiệm chi phí lớn nhất trong cả luồng — nó
 * cắt phần lớn request ngay trước khi chúng rời khỏi trình duyệt.
 */
const DEBOUNCE_MS = 350;

function useDebounced(value: string, delay = DEBOUNCE_MS) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Gợi ý địa điểm cho một ô nhập.
 *
 * `sessionToken` phải giữ nguyên suốt một phiên gõ và **đổi sau khi người dùng
 * chọn xong**: Google gộp cả chuỗi gõ với lần lấy chi tiết cuối cùng vào một
 * session để tính tiền. Component gọi hook này chịu trách nhiệm vòng đời token.
 */
export function usePlaceSuggestionsQuery(query: string, sessionToken: string) {
  const debouncedQuery = useDebounced(query);
  const trimmed = debouncedQuery.trim();
  const enabled = trimmed.length >= PLACE_QUERY_MIN_LENGTH;

  return useQuery({
    queryKey: placeQueryKeys.autocomplete(trimmed),
    queryFn: () => autocompletePlaces(trimmed, sessionToken),
    enabled,
    // Cùng một truy vấn trong một phiên soạn thiệp không cần hỏi lại; backend
    // cũng cache, đây chỉ là lớp gần người dùng nhất.
    staleTime: 10 * 60_000,
    // Gợi ý là tiện ích, hỏng thì người dùng gõ tay — thử lại chỉ tốn hạn mức.
    retry: false,
  });
}