"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Thời lượng mong muốn cho một lượt chạy hết thiệp. Tính tốc độ theo độ dài
 * từng mẫu thay vì cố định px/giây: thiệp dài và thiệp ngắn đều mất chừng này
 * để đi hết, nên bản xem thử nào cũng cho cùng một cảm giác.
 */
const RUN_SECONDS = 18;
/** Giới hạn tốc độ để mẫu quá ngắn không bò, mẫu quá dài không thành cơn lốc. */
const MIN_SPEED = 120;
const MAX_SPEED = 560;
/** Dừng lại một nhịp ở đầu thiệp trước khi cuộn, cho người xem kịp nhìn hero. */
const START_DELAY = 550;

/**
 * Cửa sổ bên trong iframe, chỉ khi còn cùng origin.
 *
 * Bản xem thử luôn khởi đầu ở route nội bộ, nhưng iframe có thể bị điều hướng
 * đi nơi khác — thiệp có bản đồ Google nhúng, một cú bấm lọt vào đó là cả khung
 * nhảy sang `maps.google.com`. Lúc ấy chỉ *đọc* `contentWindow.matchMedia` cũng
 * ném `SecurityError`, nên phải hỏi trước khi chạm.
 */
function sameOriginView(frame: HTMLIFrameElement | null) {
  const view = frame?.contentWindow;
  if (!view) return null;
  try {
    // Chạm thử một thuộc tính bị chặn khi khác origin.
    void view.location.href;
    return view;
  } catch {
    return null;
  }
}

/**
 * Tự cuộn một iframe xem thử từ đầu tới cuối rồi dừng hẳn. Dùng chung cho card
 * trong gallery (chạy khi hover) và dialog chi tiết mẫu (chạy khi mở) để hai
 * nơi cùng một nhịp.
 */
export function usePreviewAutoscroll(
  frameRef: RefObject<HTMLIFrameElement | null>,
) {
  const rafRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const play = useCallback(() => {
    const view = sameOriginView(frameRef.current);
    if (!view) return;
    if (view.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    stop();
    timerRef.current = setTimeout(() => {
      let last = 0;
      const step = (now: number) => {
        const doc = view.document.documentElement;
        // Đo lại mỗi frame: ảnh trong thiệp tải dần nên trang còn dài thêm sau
        // khi lượt chạy đã bắt đầu.
        const end = doc.scrollHeight - view.innerHeight;
        const speed = Math.min(
          MAX_SPEED,
          Math.max(MIN_SPEED, end / RUN_SECONDS),
        );
        const next = view.scrollY + (last ? ((now - last) / 1000) * speed : 0);
        last = now;
        view.scrollTo(0, Math.min(next, end));
        // Tới cuối thiệp thì dừng hẳn, không lặp lại và không nảy ngược.
        if (next < end) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, START_DELAY);
  }, [frameRef, stop]);

  /** Tua về đầu thiệp sau `delay` ms, đủ cho hiệu ứng mờ đi chạy xong. */
  const rewind = useCallback(
    (delay: number) => {
      stop();
      timerRef.current = setTimeout(() => {
        sameOriginView(frameRef.current)?.scrollTo(0, 0);
      }, delay);
    },
    [frameRef, stop],
  );

  useEffect(() => stop, [stop]);

  return { play, stop, rewind };
}
