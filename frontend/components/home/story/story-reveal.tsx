"use client";

import type { ElementType, ReactNode } from "react";
import { useGsapContext } from "@/hooks/use-gsap";
import { DURATION, EASE, gsap } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Stagger cho các phần tử con trực tiếp thay vì animate cả khối. */
  stagger?: boolean;
  delay?: number;
  /**
   * Thẻ bọc. Đặt `ul`/`ol`/`dl` khi chính các item của danh sách là thứ cần
   * stagger — bọc thêm một `div` ở giữa sẽ phá quan hệ list ↔ list item.
   */
  as?: ElementType;
};

/**
 * Reveal cơ bản (mờ + trượt lên) cho khối nội dung không phải headline.
 * Dùng chung một ease/duration với `RevealText` để nhịp cuộn thống nhất.
 */
export function StoryReveal({
  children,
  className,
  stagger = false,
  delay = 0,
  as: Tag = "div",
}: Props) {
  const scope = useGsapContext<HTMLElement>(({ tier, scope: element }) => {
    const targets = stagger ? Array.from(element.children) : [element];

    if (tier === "none") {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      targets,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: DURATION.base,
        ease: EASE.reveal,
        delay,
        stagger: stagger ? 0.09 : 0,
        scrollTrigger: { trigger: element, start: "top 88%", once: true },
      },
    );
  });

  // Marker cho quy tắc trạng thái đầu trong `globals.css`: khối tự ẩn (hoặc
  // các con của nó khi stagger) ngay từ HTML, không đợi JS chạy.
  const marker = stagger
    ? { "data-reveal-stagger": "" }
    : { "data-reveal": "" };

  return (
    <Tag ref={scope} className={cn(className)} {...marker}>
      {children}
    </Tag>
  );
}
