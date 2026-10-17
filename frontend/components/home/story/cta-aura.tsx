"use client";

import { useGsapContext } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import styles from "./cta-aura.module.css";

/**
 * Vị trí, nhịp và độ mờ cố định sẵn (không random) để markup server và client
 * khớp nhau.
 */
const MOTES = [
  { left: "8%", duration: "17s", delay: "0s", opacity: 0.3 },
  { left: "21%", duration: "23s", delay: "6s", opacity: 0.16 },
  { left: "34%", duration: "19s", delay: "11s", opacity: 0.24 },
  { left: "47%", duration: "26s", delay: "3s", opacity: 0.12 },
  { left: "58%", duration: "21s", delay: "14s", opacity: 0.28 },
  { left: "71%", duration: "24s", delay: "8s", opacity: 0.18 },
  { left: "84%", duration: "18s", delay: "17s", opacity: 0.22 },
  { left: "93%", duration: "27s", delay: "2s", opacity: 0.14 },
];

/** Bán kính hai vòng trong hệ toạ độ của viewBox. */
const DRAW_RADIUS = 172;
const SPIN_RADIUS = 193;

/**
 * Nền động của lời mời cuối: sợi chỉ vàng chạy suốt trang khép lại thành một
 * vòng tròn quanh CTA.
 *
 * - Vòng trong được *vẽ* theo tiến độ cuộn — vòng chỉ khép kín đúng lúc người
 *   xem đọc tới nút bấm, nên khối này không còn là một hình tĩnh đứng sẵn.
 * - Vòng ngoài nét đứt xoay rất chậm, và quầng sáng thở nhẹ ở giữa: hai nhịp
 *   lệch chu kỳ nhau nên mắt không bắt được điểm lặp.
 * - Vài hạt sáng bay lên trong lòng vòng (CSS thuần, xem file `.module.css`).
 *
 * Thuần trang trí nên `aria-hidden`. Ở `tier === "none"` (reduced-motion) vòng
 * trong hiện sẵn nguyên vẹn và không có chuyển động nào chạy.
 */
export function CtaAura({ className }: { className?: string }) {
  const scope = useGsapContext<HTMLDivElement>(({ tier, scope: element }) => {
    const draw = element.querySelector<SVGCircleElement>("[data-aura-draw]");
    const spin = element.querySelector<SVGCircleElement>("[data-aura-spin]");
    const glow = element.querySelector<HTMLElement>("[data-aura-glow]");

    if (draw) {
      const length = 2 * Math.PI * DRAW_RADIUS;
      gsap.set(draw, { strokeDasharray: length, strokeDashoffset: 0 });

      if (tier !== "none") {
        gsap.fromTo(
          draw,
          { strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              // Khép kín khi khối đã vào giữa màn hình, tức ngay trước lúc mắt
              // dừng ở nút bấm.
              start: "top 85%",
              end: "center center",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          },
        );
      }
    }

    if (tier === "none") return;

    if (spin) {
      gsap.to(spin, {
        rotation: 360,
        duration: 90,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
        // `svgOrigin` cần vì transform-origin theo phần trăm trên phần tử SVG
        // tính theo bounding box của chính nét vẽ, không theo tâm viewBox.
        svgOrigin: "200 200",
      });
    }

    if (glow) {
      gsap.to(glow, {
        scale: 1.07,
        opacity: 0.75,
        duration: 5.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
  });

  return (
    <div ref={scope} aria-hidden className={cn("pointer-events-none", className)}>
      <span
        data-aura-glow
        className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_13%,transparent)_0%,transparent_66%)]"
      />

      <svg viewBox="0 0 400 400" fill="none" className="size-full">
        <circle
          data-aura-draw
          cx="200"
          cy="200"
          r={DRAW_RADIUS}
          className="stroke-primary/35"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          // Bắt đầu vẽ từ đỉnh vòng tròn thay vì mép phải.
          transform="rotate(-90 200 200)"
        />
        <circle
          data-aura-spin
          cx="200"
          cy="200"
          r={SPIN_RADIUS}
          className="stroke-primary/20"
          strokeWidth="1"
          strokeDasharray="2 12"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className={styles.field}>
        {MOTES.map((mote) => (
          <span
            key={mote.left}
            className={styles.mote}
            style={{
              left: mote.left,
              animationDuration: mote.duration,
              animationDelay: mote.delay,
              ["--mote-opacity" as string]: mote.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
}
