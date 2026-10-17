"use client";

import { useGsapContext } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion";

/**
 * Vạch tiến độ nhỏ nằm trong nhãn chương: chạy đầy dần theo tiến độ cuộn của
 * chính chương chứa nó, nên khi nhãn dính ở mép trên người đọc luôn biết mình
 * đang ở đâu trong chương.
 *
 * Trigger là `<section>` cha thay vì chính vạch — vạch bị dính (sticky) nên
 * không phản ánh được vị trí thật của chương.
 */
export function ChapterProgress() {
  const scope = useGsapContext<HTMLSpanElement>(({ tier, scope: element }) => {
    const bar = element.querySelector<HTMLElement>("[data-bar]");
    const section = element.closest("section");
    if (!bar || !section || tier === "none") return;

    gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        transformOrigin: "left center",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
          // Chiều cao chương chỉ chốt sau khi các trigger có pin tính xong.
          refreshPriority: -1,
        },
      },
    );
  });

  return (
    <span
      ref={scope}
      aria-hidden
      className="relative block h-px w-16 bg-primary/25"
    >
      <span
        data-bar
        className="absolute inset-0 block origin-left scale-x-0 bg-primary"
      />
    </span>
  );
}
