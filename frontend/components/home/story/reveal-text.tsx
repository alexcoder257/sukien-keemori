"use client";

import type { ElementType } from "react";
import { useGsapContext } from "@/hooks/use-gsap";
import { DURATION, EASE, ScrollTrigger, gsap } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  /** Text hiển thị. Xuống dòng bằng `\n` để tách thành từng cụm chủ đích. */
  text: string;
  as?: ElementType;
  className?: string;
  /** Trễ trước khi cụm đầu tiên xuất hiện (giây). */
  delay?: number;
  /** Bỏ ScrollTrigger và chạy ngay khi mount — dùng cho headline hero. */
  immediate?: boolean;
};

/**
 * Headline reveal theo từng từ, gom theo cụm (mỗi dòng của `text`).
 * Markup vẫn là text thường nên SSR, SEO và screen reader không bị ảnh hưởng;
 * animation chỉ thêm inline style sau khi mount.
 */
export function RevealText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  immediate = false,
}: Props) {
  const scope = useGsapContext<HTMLElement>(({ tier, scope: element }) => {
    const words = element.querySelectorAll<HTMLElement>("[data-word]");
    if (words.length === 0) return;

    if (tier === "none") {
      gsap.set(words, { opacity: 1, y: 0 });
      return;
    }

    const tween = gsap.fromTo(
      words,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: DURATION.base,
        ease: EASE.reveal,
        stagger: 0.055,
        delay,
        paused: !immediate,
      },
    );

    if (immediate) return;

    ScrollTrigger.create({
      trigger: element,
      start: "top 85%",
      once: true,
      onEnter: () => tween.play(),
    });
  });

  return (
    <Tag ref={scope} className={cn("block", className)}>
      {text.split("\n").map((line, lineIndex) => (
        // Mặt nạ cho chữ trượt lên. Dùng `clip-path` với inset âm thay cho
        // `overflow-hidden`: hộp dòng chỉ cao bằng line-height, trong khi dấu
        // chồng tiếng Việt (ệ, ạ, ậ) vươn ra ngoài hộp đó và sẽ bị cắt. Inset
        // âm nới vùng vẽ mà không đụng tới layout — khác với padding, nó
        // không đẩy các dòng ra xa nhau. Chữ vào từ 110% bên dưới nên 0.3em
        // nới thêm ở mép dưới vẫn quá ít để lộ chúng.
        <span
          key={lineIndex}
          className="block [clip-path:inset(-0.3em_0_-0.3em_0)]"
        >
          {line.split(" ").map((word, wordIndex) => (
            // Dấu cách đặt ngoài span vì inline-block nuốt whitespace ở mép.
            <span key={`${lineIndex}-${wordIndex}`}>
              <span data-word className="inline-block will-change-transform">
                {word}
              </span>{" "}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
