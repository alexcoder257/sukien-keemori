"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";

type Props = Omit<ComponentProps<typeof Link>, "prefetch">;

/**
 * `Link` chỉ prefetch khi người dùng tỏ ý định (rê chuột, chạm, focus bàn
 * phím), không prefetch lúc lọt vào khung nhìn.
 *
 * Dành cho cụm link dày mà hiếm ai bấm (chân trang): prefetch mặc định của
 * chục link đó trên 3G giành băng thông với chính trang đang xem.
 * `prefetch={false}` trơn thì tắt luôn cả lúc hover — bấm là phải đợi một vòng
 * tới server. Mẫu lấy từ `node_modules/next/dist/docs/01-app/02-guides/prefetching.md`.
 */
export function HoverPrefetchLink({
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...props
}: Props) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={(event) => {
        setActive(true);
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        setActive(true);
        onTouchStart?.(event);
      }}
      onFocus={(event) => {
        setActive(true);
        onFocus?.(event);
      }}
    />
  );
}
