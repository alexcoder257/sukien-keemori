"use client";

import { useCallback, useEffect, useState } from "react";
import { useSmoothScroll } from "@/contexts/smooth-scroll-provider";

/** Tốc độ mặc định (px nội dung mỗi giây) — nhịp đọc lướt, không phải tua. */
const DEFAULT_SPEED = 85;
/** Bỏ thời gian bị nghẽn thay vì nhảy bù quãng cuộn sau một frame chậm. */
const MAX_FRAME_MS = 50;

/**
 * Người dùng tự cuộn nghĩa là "để tôi tự xem": tạm dừng, không tắt hẳn — muốn
 * chạy tiếp thì bấm một cái. Không nghe `touchstart`: một cú vuốt trên mobile
 * bắt đầu bằng chạm, nếu tính là bấm thì vừa dừng đã chạy lại.
 */
const PAUSE_EVENTS = ["wheel", "touchmove", "keydown"] as const;

/** Bấm vào các phần tử này là thao tác của riêng chúng, không phải pause/play. */
const INTERACTIVE = "a[href], button, input, select, textarea, [role='button']";

type Options = {
  /** px mỗi giây. */
  speed?: number;
  /** Trễ trước lần chạy đầu, để người xem kịp nhìn màn hero. */
  startDelay?: number;
};

/**
 * Tự cuộn trang tới cuối rồi dừng, kiểu một đoạn phim: khách mở thiệp ra là nó
 * tự trôi qua từng phần, không phải vuốt.
 *
 * Điều khiển như một nút play/pause: bấm vào trang thì dừng, bấm lần nữa thì
 * chạy tiếp từ đúng chỗ đang đứng. Tự cuộn tay cũng chỉ là tạm dừng — người xem
 * có thể giao lại quyền lái bất cứ lúc nào.
 *
 * Người bật `prefers-reduced-motion` không có Lenis và cũng không nên bị trang
 * tự chạy, nên hook đứng im ở nhánh đó.
 *
 * Trả về trạng thái và hàm đảo trạng thái để nơi gọi hiện chỉ báo play/pause.
 */
export function useAutoScroll(active: boolean, options: Options = {}) {
  const { speed = DEFAULT_SPEED, startDelay = 1200 } = options;
  const { setScroll } = useSmoothScroll();
  const [paused, setPaused] = useState(false);
  /** Đã chạy lần nào kể từ lúc bật chưa — chỉ lần đầu mới phải chờ `startDelay`. */
  const [hasRun, setHasRun] = useState(false);

  // Bật/tắt tự chạy là một lần khởi động lại. Chỉnh trạng thái ngay trong lúc
  // render (thay vì qua effect) để không mất một vòng render với giá trị cũ.
  const [lastActive, setLastActive] = useState(active);
  if (lastActive !== active) {
    setLastActive(active);
    setPaused(false);
    setHasRun(false);
  }

  const playing = active && !paused;
  const toggle = useCallback(() => setPaused((current) => !current), []);

  // Vòng chạy: chỉ sống khi đang play.
  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let timer = 0;
    let last = 0;
    // Đọc lại vị trí mỗi lần chạy: người xem có thể vừa tự cuộn tới chỗ khác
    // trong lúc tạm dừng.
    let position = window.scrollY;
    let end = 0;

    // Chiều dài chỉ đổi khi layout/viewport đổi. Không ép trình duyệt đo lại
    // toàn trang thiệp ở mỗi frame, ngay sau khi các hiệu ứng vừa ghi style.
    const measureEnd = () => {
      end = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    };
    measureEnd();
    const sizeObserver = new ResizeObserver(measureEnd);
    sizeObserver.observe(document.body);
    window.addEventListener("resize", measureEnd);

    // rAF có thể nghỉ khi đổi tab/khóa màn hình; trở lại thì đi tiếp tại chỗ.
    const resetClock = () => {
      last = 0;
    };
    document.addEventListener("visibilitychange", resetClock);

    const step = (now: number) => {
      if (document.hidden) {
        last = 0;
        frame = requestAnimationFrame(step);
        return;
      }
      position += last ? (Math.min(now - last, MAX_FRAME_MS) / 1000) * speed : 0;
      last = now;

      if (position >= end) {
        setScroll(end);
        setPaused(true);
        return;
      }

      setScroll(position);
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      position = window.scrollY;
      last = 0;
      frame = requestAnimationFrame(step);
    };

    if (hasRun) {
      start();
    } else {
      timer = window.setTimeout(() => {
        setHasRun(true);
        start();
      }, startDelay);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      sizeObserver.disconnect();
      window.removeEventListener("resize", measureEnd);
      document.removeEventListener("visibilitychange", resetClock);
    };
  }, [playing, hasRun, speed, startDelay, setScroll]);

  // Thao tác của người dùng: cuộn tay là tạm dừng, bấm là đảo trạng thái.
  useEffect(() => {
    if (!active) return;

    const pause = () => setPaused(true);
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      // Bấm vào liên kết trong trang (mục lục trang nhất của mẫu Tin Vui) là
      // người xem tự chọn chỗ để tới — tạm dừng chứ không đảo trạng thái. Bỏ
      // nhánh này thì vòng tự cuộn và cú nhảy tới mục giành nhau vị trí cuộn,
      // và trang trôi từng pixel một thay vì tới nơi.
      if (target?.closest('a[href^="#"]')) {
        pause();
        return;
      }
      if (target?.closest(INTERACTIVE)) return;
      toggle();
    };

    for (const event of PAUSE_EVENTS) {
      window.addEventListener(event, pause, { passive: true });
    }
    window.addEventListener("click", onClick);

    return () => {
      for (const event of PAUSE_EVENTS) {
        window.removeEventListener(event, pause);
      }
      window.removeEventListener("click", onClick);
    };
  }, [active, toggle]);

  return { playing, toggle };
}
