"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { ScrollTrigger, gsap, registerScrollTrigger } from "@/lib/motion";

/**
 * Những route cuộn bằng chính trình duyệt, không qua Lenis.
 *
 * Lenis đổi cuộn từ compositor thread sang main thread: mỗi pixel cuộn là một
 * lượt tính trong JS. Đó là cái giá phải trả ở trang nào có hiệu ứng `scrub`
 * hoặc ghim — chúng đọc vị trí cuộn theo từng frame nên cần lớp nội suy này,
 * không có thì giật từng nấc. Trang nào **không** có hiệu ứng đó thì Lenis chỉ
 * còn lại phần giá: mọi tác vụ nặng trên main thread (giải mã ảnh chẳng hạn)
 * đóng băng luôn cả cuộn, trong khi cuộn gốc của trình duyệt vẫn chạy mượt vì
 * nó nằm ở thread khác.
 *
 * Kho mẫu là đúng ca đó: một lưới card, không scrub, không ghim, nhưng mỗi
 * card là một ảnh chụp dài phải giải mã khi lộ ra. Đo trên máy dev, một ảnh tốn
 * 32–50ms — qua Lenis thì ngần ấy mili-giây là ngần ấy thời gian trang đứng
 * hình.
 *
 * Khớp đúng trang danh sách, không khớp `/mau-thiep/<slug>/demo` — trang đó là
 * một tấm thiệp thật và có chuyển động riêng.
 */
const NATIVE_SCROLL_ROUTE = /^\/(?:vi|en)\/mau-thiep\/?$/;

/**
 * Khoá/mở cuộn của trang. Tách thành context vì màn mở đầu homepage phải giữ
 * người xem ở đỉnh trang trong lúc animation chạy, mà chỉ provider này mới
 * cầm instance Lenis.
 *
 * Mặc định là no-op để nơi gọi không phải kiểm tra `null`: trang không bọc
 * provider vẫn chạy được. Với user bật `prefers-reduced-motion` thì không có
 * Lenis, nhưng nhánh khoá bằng CSS bên dưới vẫn còn tác dụng.
 */
type SmoothScroll = {
  lockScroll: () => void;
  unlockScroll: () => void;
  /**
   * Cuộn tới một vị trí tuyệt đối. Phải đi qua Lenis, vì `window.scrollTo` sẽ
   * đánh nhau với vòng nội suy của nó và cho ra một cú giật.
   */
  scrollTo: (target: number) => void;
  /**
   * Đặt thẳng vị trí cuộn, không nội suy. Dành cho nơi tự chạy chuyển động theo
   * từng frame (thiệp tự cuộn); vẫn phải đi qua Lenis, nếu không nó sẽ kéo
   * trang về vị trí mục tiêu cũ ngay frame sau.
   */
  setScroll: (target: number) => void;
};

const NOOP: SmoothScroll = {
  lockScroll: () => {},
  unlockScroll: () => {},
  scrollTo: (target: number) =>
    window.scrollTo({ top: target, behavior: "smooth" }),
  setScroll: (target: number) => window.scrollTo(0, target),
};

const SmoothScrollContext = createContext<SmoothScroll | null>(null);

export function useSmoothScroll(): SmoothScroll {
  return useContext(SmoothScrollContext) ?? NOOP;
}

/**
 * Cuộn mượt toàn trang (Lenis) và đồng bộ nó với GSAP.
 *
 * Vì sao cần: mọi hiệu ứng `scrub` đọc vị trí cuộn theo từng frame, trong khi
 * bánh xe chuột/trackpad trả về các bước nhảy rời rạc — không có lớp nội suy
 * này thì hiệu ứng ghim và parallax bị giật từng nấc.
 *
 * Ba điểm phải giữ đúng, nếu sai sẽ lệch một frame giữa nội dung và hiệu ứng:
 * - Lenis đẩy `ScrollTrigger.update` thay vì để ScrollTrigger tự nghe scroll.
 * - Lenis chạy trong ticker của GSAP, không dùng `requestAnimationFrame` riêng.
 * - Tắt `lagSmoothing` để GSAP không tự nhảy cóc khi có frame bị nghẽn.
 *
 * Người bật `prefers-reduced-motion` giữ nguyên cuộn gốc của trình duyệt.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Điều hướng phía client không unmount provider, nên route phải nằm trong
    // deps: rời kho mẫu là dựng lại Lenis, vào kho mẫu là tháo nó ra.
    if (NATIVE_SCROLL_ROUTE.test(pathname)) return;
    // Iframe xem thử được trang cha cuộn bằng `scrollTo` theo từng frame; vòng
    // nội suy của Lenis sẽ giành lại vị trí cuộn và bản xem thử đứng im.
    if (document.documentElement.dataset.embed) return;

    registerScrollTrigger();
    // `content` phải là `body`, không để mặc định là `html`: Lenis đo lại giới
    // hạn cuộn bằng ResizeObserver trên phần tử này, mà `html` đang là
    // `h-full` nên hộp của nó luôn bằng viewport — nội dung dài thêm (mở một
    // block trong editor chẳng hạn) không sinh resize, và trang kẹt ở chiều
    // cao đo được lúc mount. `body` là `min-h-full` nên cao theo nội dung.
    const lenis = new Lenis({ duration: 1.05, content: document.body });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  const value = useMemo<SmoothScroll>(
    () => ({
      lockScroll: () => {
        lenisRef.current?.stop();
        // Lenis không chặn phím mũi tên/Space và cũng không tồn tại ở nhánh
        // reduced-motion, nên khoá thêm một lớp ở tầng CSS.
        document.documentElement.style.overflow = "hidden";
      },
      unlockScroll: () => {
        document.documentElement.style.overflow = "";
        lenisRef.current?.start();
      },
      scrollTo: (target: number) => {
        const lenis = lenisRef.current;
        // Vắng Lenis giờ có hai lý do khác hẳn nhau — user tắt chuyển động, hay
        // route này cố ý cuộn bằng trình duyệt (`NATIVE_SCROLL_ROUTE`) — nên
        // không suy ra ý người dùng từ chỗ này được nữa, phải hỏi thẳng. Đoán
        // nhầm thì nút "lên đầu trang" ở kho mẫu nhảy cụp một cái thay vì trôi.
        if (!lenis) {
          const reduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          window.scrollTo({
            top: target,
            behavior: reduce ? "auto" : "smooth",
          });
          return;
        }
        lenis.scrollTo(target, { duration: 1.1 });
      },
      setScroll: (target: number) => {
        const lenis = lenisRef.current;
        if (lenis) {
          // `immediate`: người gọi đang tự vẽ chuyển động theo từng frame, để
          // Lenis nội suy thêm một lần nữa thì hai vòng chạy chồng lên nhau.
          lenis.scrollTo(target, { immediate: true, force: true });
          return;
        }
        window.scrollTo(0, target);
      },
    }),
    [],
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
