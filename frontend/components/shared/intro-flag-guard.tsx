"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { clearPendingIntro } from "@/lib/intro-session";

/**
 * Dọn cờ `data-intro="pending"` mà điều hướng mềm đặt lại lên `<html>`.
 *
 * Cờ này do JSX của root layout dựng, nên nó quay lại mỗi lần segment
 * `[locale]` đổi giá trị — tức mỗi lần đổi ngôn ngữ — trong khi script bootstrap
 * đầu `<body>` chỉ chạy ở lần mở document. Xem `clearPendingIntro` để biết vì
 * sao `pending` không còn hợp lệ khi JavaScript của app đã chạy.
 *
 * `useLayoutEffect` chứ không phải `useEffect`: React đặt thuộc tính trong pha
 * commit, nên chờ tới `useEffect` là hở một frame không có header.
 *
 * Đặt ở root layout chứ không ở `HeroStage`: cảnh mở đầu chỉ có ở trang chủ,
 * còn cờ sót lại thì ẩn app chrome ở mọi route.
 */
export function IntroFlagGuard() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    clearPendingIntro();
  }, [pathname]);

  return null;
}
