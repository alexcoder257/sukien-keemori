import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Điểm đăng ký GSAP duy nhất của app. Mọi client component dùng scroll
 * animation phải import `gsap`/`ScrollTrigger` từ đây để plugin chỉ đăng ký
 * một lần và không chạy trong lúc render phía server.
 */
let registered = false;

export function registerScrollTrigger() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export { gsap, ScrollTrigger };

/** Easing dùng chung để mọi section có cùng "nhịp" chuyển động. */
export const EASE = {
  /** Vào chậm rồi dừng mềm — dùng cho reveal nội dung. */
  reveal: "power3.out",
  /** Chuyển động lớn có trọng lượng — dùng cho ảnh, panel. */
  cinematic: "power2.inOut",
  /** Hover/CTA. */
  ui: "power2.out",
} as const;

/** Thời lượng chuẩn (giây). */
export const DURATION = {
  fast: 0.4,
  base: 0.8,
  slow: 1.2,
} as const;

export type MotionTier = "full" | "reduced" | "none";

/**
 * Ba mức chuyển động:
 * - `none`  : user bật prefers-reduced-motion → chỉ fade tối thiểu.
 * - `reduced`: tablet/mobile → bỏ pin/scrub, giữ reveal.
 * - `full`  : desktop → full cinematic scroll.
 */
export function getMotionTier(): MotionTier {
  if (typeof window === "undefined") return "reduced";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "none";
  }
  return window.matchMedia("(min-width: 1024px)").matches ? "full" : "reduced";
}
