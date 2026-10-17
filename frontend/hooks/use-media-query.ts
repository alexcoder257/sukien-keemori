"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Đọc một media query và render lại khi nó đổi.
 *
 * Phía server (và lần hydrate đầu) luôn trả `false`: server không biết bề rộng
 * màn hình, nên chỉ dùng hook này cho thứ **chưa hiện ra lúc tải trang** (một
 * popover đang đóng…), không dùng để chọn bố cục của nội dung nhìn thấy ngay —
 * việc đó để CSS làm.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
