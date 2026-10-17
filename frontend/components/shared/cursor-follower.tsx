"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EASE, gsap } from "@/lib/motion";
import styles from "./cursor-follower.module.css";

/**
 * Phần tử được coi là "bấm được". `[data-cursor]` cho phép mọi component tự
 * khai báo trạng thái con trỏ mà không phải sửa lại danh sách này.
 */
const INTERACTIVE =
  'a[href], button:not(:disabled), summary, [role="button"], [role="tab"], label[for], [data-cursor]';

/**
 * Vùng giữ nguyên con trỏ hệ thống: ô nhập liệu cần caret thật, còn `iframe`
 * không bắn `pointermove` ra ngoài nên nếu không giấu thì con trỏ tự vẽ sẽ
 * đứng chết ở mép khung nhúng.
 */
const NATIVE = "input, textarea, select, iframe, [contenteditable='true'], [data-cursor='native']";

/**
 * Gốc của một bề mặt bấm-đâu-cũng-vào: cả card lẫn ảnh/panel đều thường có một
 * lớp phủ `button`/`a` trải kín bên trên. Lớp phủ đó mới là thứ nằm dưới con
 * trỏ, nên phải leo ngược lên bề mặt bao ngoài thì mới ra đúng trạng thái —
 * trừ khi phần tử tự khai `data-cursor="button"`.
 */
const SURFACE = '[data-cursor="card"], [data-cursor="media"]';

type CursorState = "idle" | "link" | "card" | "media" | "hidden";

type CursorHit = {
  state: CursorState;
  /** Chữ hiện trong vòng tròn; rỗng nghĩa là hiện mũi tên hoặc không hiện gì. */
  text: string;
};

const HIDDEN: CursorHit = { state: "hidden", text: "" };

/**
 * Con trỏ tự vẽ hai lớp: một chấm bám gần như tức thì để giữ độ chính xác, và
 * một vòng kính trễ hơn để tạo quán tính. Vòng phình ra kèm mũi tên hoặc chữ
 * khi rê vào phần tử bấm được.
 *
 * Nền vòng tròn cố ý gần như trong suốt và dựa vào `backdrop-filter`: người
 * dùng phải đọc được nút hoặc nhìn được ảnh nằm ngay dưới con trỏ.
 *
 * Chữ mặc định là `label` (đã dịch, truyền từ Server Component). Phần tử nào
 * cần chữ khác thì tự khai báo `data-cursor-label="..."`.
 *
 * Chỉ chạy trên thiết bị thật sự có chuột (`hover: hover` + `pointer: fine`) và
 * khi người dùng không bật `prefers-reduced-motion`; ngoài ra con trỏ hệ thống
 * được giữ nguyên. Toàn bộ phần tử là `aria-hidden` + `pointer-events: none`
 * nên không ảnh hưởng tới bàn phím hay screen reader.
 */
export function CursorFollower({ label }: { label: string }) {
  const [enabled, setEnabled] = useState(false);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLSpanElement>(null);

  // Đọc trong listener chuột nên giữ trong ref để không phải gắn lại listener
  // mỗi lần prop đổi (đổi ngôn ngữ).
  const fallback = useRef(label);
  useEffect(() => {
    fallback.current = label;
  }, [label]);

  useEffect(() => {
    const query = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const sync = () => setEnabled(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const ringEl = ring.current;
    const dotEl = dot.current;
    if (!enabled || !ringEl || !dotEl) return;

    const root = document.documentElement;
    root.classList.add(styles.nativeHidden);

    // `quickTo` ghi thẳng vào transform mỗi frame — rẻ hơn nhiều so với tạo
    // tween mới cho từng lần chuột dịch chuyển. Chấm bám sát để con trỏ không
    // có cảm giác trễ; vòng tròn chạy sau mới tạo được quán tính.
    const move = {
      dotX: gsap.quickTo(dotEl, "x", { duration: 0.08, ease: EASE.ui }),
      dotY: gsap.quickTo(dotEl, "y", { duration: 0.08, ease: EASE.ui }),
      ringX: gsap.quickTo(ringEl, "x", { duration: 0.42, ease: EASE.ui }),
      ringY: gsap.quickTo(ringEl, "y", { duration: 0.42, ease: EASE.ui }),
    };

    let current: CursorHit = HIDDEN;
    let lastX = -1;
    let lastY = -1;

    const apply = (next: CursorHit) => {
      if (next.state === current.state && next.text === current.text) return;

      ringEl.dataset.state = next.state;
      dotEl.dataset.state = next.state;

      const showCaption = Boolean(next.text) && next.state !== "hidden";
      // Chữ gán ngay khi có chữ mới. Lúc ẩn thì giữ nguyên chữ cũ và để nó mờ
      // dần, nên lướt nhanh giữa hai phần tử không bao giờ kẹt chữ sai.
      if (showCaption && caption.current) caption.current.textContent = next.text;
      // Mọi thứ bấm được đều có mũi tên — nút, card lẫn ảnh. Chỉ trạng thái nghỉ
      // và lúc ẩn mới để vòng tròn trống ruột.
      ringEl.dataset.mode = showCaption
        ? "caption"
        : next.state === "idle" || next.state === "hidden"
          ? "none"
          : "arrow";

      current = next;
    };

    const resolve = (target: Element | null): CursorHit => {
      if (!target) return { state: "idle", text: "" };
      if (target.closest(NATIVE)) return HIDDEN;
      const hit = target.closest<HTMLElement>(INTERACTIVE);
      if (!hit) return { state: "idle", text: "" };

      // Trong một bề mặt, mặc định mọi thứ thuộc về bề mặt đó. Không thể dựa
      // vào hình học để đoán đâu là thân card đâu là nút — control thật bên
      // trong phải tự khai `data-cursor="button"` nếu muốn con trỏ của nút.
      const surface =
        hit.dataset.cursor === "button" ? null : hit.closest<HTMLElement>(SURFACE);
      if (surface) {
        // Ảnh và panel mẫu thiệp cần nói rõ "Xem", mũi tên không đủ nghĩa.
        const media = surface.dataset.cursor === "media";
        return {
          state: media ? "media" : "card",
          text: surface.dataset.cursorLabel ?? (media ? fallback.current : ""),
        };
      }

      // Nút thật: vòng tròn để trống, nhãn của nút mới là thứ cần đọc.
      return { state: "link", text: hit.dataset.cursorLabel ?? "" };
    };

    const onMove = (event: PointerEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      move.dotX(lastX);
      move.dotY(lastY);
      move.ringX(lastX);
      move.ringY(lastY);
      apply(resolve(event.target instanceof Element ? event.target : null));
    };

    /**
     * Chuột đứng yên nhưng nội dung bên dưới đổi (cuộn trang, đóng dialog, nút
     * chuyển sang disabled) thì `pointermove` không bắn, và vòng tròn sẽ kẹt ở
     * trạng thái cũ. Đọc lại phần tử ngay dưới vị trí chuột để đồng bộ.
     *
     * Gom về một lần mỗi frame: `elementFromPoint` ép trình duyệt tính lại
     * layout, mà `scroll` bắn dày hơn nhịp vẽ nên nếu chạy thẳng thì mỗi cú
     * cuộn phải flush layout nhiều lần vô ích.
     */
    let queued = 0;
    const resync = () => {
      if (lastX < 0 || queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        apply(resolve(document.elementFromPoint(lastX, lastY)));
      });
    };

    const onPress = (pressed: boolean) => () => {
      ringEl.dataset.pressed = String(pressed);
    };

    // Chuột rời khỏi cửa sổ thì giấu hẳn, nếu không chấm sẽ đứng lại ở mép.
    const onLeave = () => {
      ringEl.dataset.pressed = "false";
      apply(HIDDEN);
    };

    const down = onPress(true);
    const up = onPress(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("scroll", resync, { passive: true, capture: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("scroll", resync, { capture: true });
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (queued) cancelAnimationFrame(queued);
      root.classList.remove(styles.nativeHidden);
      gsap.killTweensOf([ringEl, dotEl]);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ring}
        aria-hidden
        data-app-chrome
        data-state="hidden"
        data-mode="none"
        data-pressed="false"
        className={styles.ring}
      >
        {/* Mũi tên **ngang sang phải**, không chéo lên: chéo lên là quy ước của
            link mở ra ngoài, mà gần như mọi thứ con trỏ này rê qua đều là điều
            hướng trong chính website. */}
        <ArrowRight aria-hidden className={styles.arrow} strokeWidth={1.75} />
        <span ref={caption} className={styles.caption} />
      </div>
      <div ref={dot} aria-hidden data-app-chrome data-state="hidden" className={styles.dot} />
    </>
  );
}
