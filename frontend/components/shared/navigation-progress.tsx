"use client";

import { useEffect } from "react";
import NextTopLoader, { useTopLoader } from "nextjs-toploader";

type NavigationStartDetail = {
  navigationType: "push" | "replace" | "traverse";
};

/**
 * Thanh tiến trình mảnh ở mép trên khi chuyển route.
 *
 * Chỉ báo khoảng **trước khi route commit**; phần chờ dữ liệu sau đó là việc
 * của `loading.tsx` (skeleton) ở từng route. Nó không chặn gì và không che
 * trang — lớp che toàn màn hình KEEMORI từng làm việc này đã bị gỡ vì nó cộng
 * ~1.5s vào mọi lần chuyển trang, kể cả khi route đã sẵn sàng sau 200ms.
 *
 * Thư viện tự bật khi click `<a>` và tự tắt khi `history.pushState` /
 * `replaceState` chạy (lúc Next commit route). Nó **không** thấy
 * `router.push`, nên phần đó đi qua `onRouterTransitionStart` trong
 * `instrumentation-client.ts`. Back/forward bỏ qua: thư viện tắt thanh ngay ở
 * `popstate`, bật lên chỉ để lại một thanh treo.
 *
 * Màu là `--ring`: Deep Gold trên nền giấy, Champagne trên nền tối — Champagne
 * trên Paper chỉ 1.32:1, một vệt 2px ở đó gần như vô hình.
 */
export function NavigationProgress() {
  const loader = useTopLoader();

  useEffect(() => {
    const onNavigationStart = (event: Event) => {
      const { navigationType } = (event as CustomEvent<NavigationStartDetail>)
        .detail;
      if (navigationType !== "traverse") loader.start();
    };

    window.addEventListener("tco:navigation-start", onNavigationStart);
    return () =>
      window.removeEventListener("tco:navigation-start", onNavigationStart);
  }, [loader]);

  return (
    <NextTopLoader
      color="var(--ring)"
      height={2}
      showSpinner={false}
      shadow={false}
      showForHashAnchor={false}
    />
  );
}
