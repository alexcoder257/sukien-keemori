"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useGsapContext, useMotionTier } from "@/hooks/use-gsap";
import { DURATION, EASE, gsap } from "@/lib/motion";

type Item = { question: string; answer: string };

/**
 * Accordion mở/đóng bằng GSAP (animate chiều cao thật, không dùng max-height).
 *
 * Chiều cao do GSAP ghi trực tiếp vào style, React không render lại thuộc tính
 * này để tránh cắt ngang animation. Nút là `<button>` thật kèm
 * `aria-expanded`/`aria-controls`, panel đóng được đánh dấu `inert` nên bàn
 * phím và screen reader vẫn đúng.
 */
export function FaqAccordion({ items }: { items: Item[] }) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);
  const panels = useRef<Map<number, HTMLDivElement>>(new Map());
  const tier = useMotionTier();
  // `tier` chỉ có giá trị sau khi mount. Trước đó mọi câu trả lời để mở, nên
  // khi không có JS thì FAQ vẫn đọc được đầy đủ.
  const interactive = tier !== null;

  // Từng hàng câu hỏi hiện lần lượt khi danh sách vào khung nhìn. Chỉ chạm tới
  // `li`, không đụng vào chiều cao panel do `toggle` quản lý.
  const list = useGsapContext<HTMLUListElement>(({ tier, scope: element }) => {
    const rows = gsap.utils.toArray<HTMLElement>(":scope > li", element);
    if (tier === "none") {
      gsap.set(rows, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      rows,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: DURATION.base,
        ease: EASE.reveal,
        stagger: 0.08,
        scrollTrigger: { trigger: element, start: "top 85%", once: true },
      },
    );
  });

  useLayoutEffect(() => {
    panels.current.forEach((panel, key) => {
      gsap.set(panel, { height: key === 0 ? "auto" : 0 });
      gsap.set(panel.firstElementChild, { opacity: key === 0 ? 1 : 0 });
    });
  }, []);

  const toggle = (index: number) => {
    const next = open === index ? null : index;
    setOpen(next);

    panels.current.forEach((panel, key) => {
      const shouldOpen = key === next;
      const content = panel.firstElementChild as HTMLElement | null;
      if (!content) return;

      gsap.killTweensOf([panel, content]);

      if (tier === "none") {
        gsap.set(panel, { height: shouldOpen ? "auto" : 0 });
        gsap.set(content, { opacity: shouldOpen ? 1 : 0, y: 0 });
        return;
      }

      gsap.to(panel, {
        height: shouldOpen ? content.offsetHeight : 0,
        duration: 0.42,
        ease: EASE.ui,
        onComplete: () => {
          if (shouldOpen) gsap.set(panel, { height: "auto" });
        },
      });
      gsap.to(content, {
        opacity: shouldOpen ? 1 : 0,
        y: shouldOpen ? 0 : -6,
        duration: 0.32,
        ease: EASE.ui,
      });
    });
  };

  return (
    <ul ref={list} className="divide-y divide-border border-y border-border">
      {items.map((item, index) => {
        const expanded = !interactive || open === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <li key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-body-lg font-medium transition-colors hover:text-primary"
              >
                {item.question}
                <Plus
                  aria-hidden
                  className={`size-4 shrink-0 text-primary transition-transform duration-300 ${expanded ? "rotate-45" : ""}`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!expanded}
              ref={(node) => {
                if (node) panels.current.set(index, node);
                else panels.current.delete(index);
              }}
              className="overflow-hidden"
            >
              <p className="max-w-2xl pb-6 text-body text-muted-foreground">
                {item.answer}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
