/**
 * Next.js gọi hook này ngay khi một client navigation bắt đầu, trước khi route
 * mới sẵn sàng. `NavigationProgress` nghe event này để bật thanh tiến trình cả
 * cho `router.push`/`router.replace` — thư viện chỉ tự bắt click vào `<a>`.
 */
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  window.dispatchEvent(
    new CustomEvent("tco:navigation-start", {
      detail: { url, navigationType },
    }),
  );
}
