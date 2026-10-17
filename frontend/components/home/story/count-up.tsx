"use client";

import { useGsapContext } from "@/hooks/use-gsap";
import { EASE, ScrollTrigger, gsap } from "@/lib/motion";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/config";

type Props = {
  value: number;
  locale: Locale;
  /** Số chữ số thập phân — dùng cho điểm đánh giá (4.9). */
  decimals?: number;
  suffix?: string;
  className?: string;
};

/**
 * Số đếm tăng dần khi vào khung nhìn. Giá trị cuối được render sẵn phía server
 * nên nếu JS chưa chạy hoặc reduced-motion thì vẫn hiển thị đúng.
 */
export function CountUp({
  value,
  locale,
  decimals = 0,
  suffix = "",
  className,
}: Props) {
  const formatted = formatNumber(value, locale, decimals);

  const scope = useGsapContext<HTMLSpanElement>(({ tier, scope: element }) => {
    const output = element.querySelector<HTMLElement>("[data-value]");
    if (!output || tier === "none") return;

    const counter = { current: 0 };
    const tween = gsap.to(counter, {
      current: value,
      duration: 1.6,
      ease: EASE.cinematic,
      paused: true,
      onUpdate: () => {
        output.textContent = formatNumber(counter.current, locale, decimals);
      },
      onComplete: () => {
        output.textContent = formatted;
      },
    });

    ScrollTrigger.create({
      trigger: element,
      start: "top 90%",
      once: true,
      onEnter: () => tween.play(),
    });
  });

  return (
    <span ref={scope} className={className}>
      <span data-value>{formatted}</span>
      {suffix}
    </span>
  );
}
