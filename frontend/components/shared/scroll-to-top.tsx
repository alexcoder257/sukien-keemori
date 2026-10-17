"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useSmoothScroll } from "@/contexts/smooth-scroll-provider";
import { cn } from "@/lib/utils";

/** Chỉ hiện sau khi đã cuộn hơn một màn hình — trước đó nút không có việc gì. */
const THRESHOLD_RATIO = 1.2;

/**
 * Nền đặc và icon dùng cùng cặp token để giữ tương phản cả khi theme website
 * tối nhưng nội dung thiệp bên dưới sáng. Viền và bóng tách nút khỏi nền ảnh.
 *
 * Cuộn qua `useSmoothScroll` chứ không gọi `window.scrollTo`: Lenis đang cầm
 * vòng nội suy của trang, hai bên cùng ghi vị trí cuộn sẽ giật.
 */
export function ScrollToTop({ label }: { label: string }) {
  const { scrollTo } = useSmoothScroll();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      setVisible(window.scrollY > window.innerHeight * THRESHOLD_RATIO);
    };

    // Scroll bắn rất dày; gom về mỗi frame một lần đọc layout.
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => scrollTo(0)}
      aria-label={label}
      title={label}
      data-app-chrome
      data-floating-action
      // `inert` khi ẩn: nút mờ hết cỡ vẫn nằm trong luồng tab nếu chỉ đặt
      // opacity, và người dùng bàn phím sẽ focus vào một thứ vô hình.
      inert={!visible}
      className={cn(
        "fixed right-6 bottom-6 z-40 flex size-12 items-center justify-center rounded-full",
        "border border-card-foreground/50 bg-card text-card-foreground shadow-lg",
        "transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp aria-hidden className="size-5" />
    </button>
  );
}
