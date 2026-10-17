"use client";

import { useLayoutEffect } from "react";

type Props = {
  activeKey: string | null;
  containerId: string;
};

/** Giữ mục đang chọn trong vùng nhìn thấy của sidebar sau mỗi lần đổi route. */
export function ActiveNavScroll({ activeKey, containerId }: Props) {
  useLayoutEffect(() => {
    if (!activeKey || !window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Mobile và desktop cùng tồn tại trong DOM; chỉ lấy link đang hiển thị.
      const current = Array.from(
        container.querySelectorAll<HTMLElement>('a[aria-current="page"]'),
      ).find((element) => element.getClientRects().length > 0);
      if (!current) return;

      const containerRect = container.getBoundingClientRect();
      const currentRect = current.getBoundingClientRect();
      const safeMargin = 16;
      let nextScrollTop = container.scrollTop;

      if (currentRect.top < containerRect.top + safeMargin) {
        nextScrollTop += currentRect.top - containerRect.top - safeMargin;
      } else if (currentRect.bottom > containerRect.bottom - safeMargin) {
        nextScrollTop += currentRect.bottom - containerRect.bottom + safeMargin;
      }

      if (nextScrollTop !== container.scrollTop) {
        container.scrollTo({ top: nextScrollTop, behavior: "auto" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeKey, containerId]);

  return null;
}
