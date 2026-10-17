"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap, getMotionTier, registerScrollTrigger } from "@/lib/motion";
import type { MotionTier } from "@/lib/motion";

/**
 * Chạy một khối animation GSAP trong `gsap.context` giới hạn ở `scope` và tự
 * revert (kill tween + ScrollTrigger + inline style) khi unmount hoặc khi
 * motion tier đổi.
 *
 * Callback nhận motion tier hiện tại để mỗi section tự quyết định mức phức tạp
 * thay vì viết điều kiện breakpoint rải rác.
 *
 * Trả về một hàm từ `setup` nếu section có thứ mà `gsap.context` không dọn hộ
 * được — event listener trên `window`/`document` chẳng hạn. GSAP gọi hàm đó
 * cùng lúc với revert.
 */
export function useGsapContext<T extends HTMLElement = HTMLDivElement>(
  setup: (context: { tier: MotionTier; scope: T }) => void | (() => void),
) {
  const scope = useRef<T>(null);
  const setupRef = useRef(setup);
  const tier = useMotionTier();

  // Giữ callback mới nhất mà không đưa nó vào deps của effect bên dưới —
  // animation chỉ cần dựng lại khi motion tier đổi.
  useLayoutEffect(() => {
    setupRef.current = setup;
  });

  useLayoutEffect(() => {
    const element = scope.current;
    if (!element || tier === null) return;

    registerScrollTrigger();
    const ctx = gsap.context(() => setupRef.current({ tier, scope: element }), element);
    return () => ctx.revert();
  }, [tier]);

  return scope;
}

/**
 * Motion tier hiện tại; `null` ở lần render đầu (kể cả trên server) để markup
 * SSR và client khớp nhau — animation chỉ khởi động sau khi mount.
 */
export function useMotionTier(): MotionTier | null {
  const [tier, setTier] = useState<MotionTier | null>(null);

  useLayoutEffect(() => {
    const sync = () => setTier(getMotionTier());
    sync();

    const queries = [
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(min-width: 1024px)"),
    ];
    queries.forEach((query) => query.addEventListener("change", sync));
    return () =>
      queries.forEach((query) => query.removeEventListener("change", sync));
  }, []);

  return tier;
}
