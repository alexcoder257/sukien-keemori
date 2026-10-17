"use client";

import type { ReactNode } from "react";
import { useSmoothScroll } from "@/contexts/smooth-scroll-provider";
import { useGsapContext } from "@/hooks/use-gsap";
import { EASE, ScrollTrigger, gsap } from "@/lib/motion";
import type { MotionTier } from "@/lib/motion";
import { completeIntro, readIntroMode } from "@/lib/intro-session";

/**
 * Nhịp của cảnh, tính bằng giây kể từ lúc mount. Bốn mốc này là bản dựng của
 * "The Invitation Reveal" — đọc từ trên xuống là đọc được cả cảnh.
 */
const CUE = {
  /** Khung 1 — wordmark và tagline ký tên cho cảnh mở đầu. */
  brand: 0,
  /** Khung 2 — giữ tagline đủ lâu để đọc rồi phong bì mới hiện ra. */
  envelope: 1.5,
  /** Khung 3 — dấu sáp xoay mở, nắp lật lên, tấm thiệp nhô ra. */
  open: 2.2,
  /** Khung 4 — bức ảnh nở kín khung hình, thiệp về chỗ, chữ vào. */
  compose: 4.05,
  /** Điểm kết của cảnh. */
  end: 5,
} as const;

/** Vị trí nghỉ của tấm thiệp sau khi nhô hẳn ra khỏi phong bì (theo % chiều cao thiệp). */
const CARD_RISE = { from: 72, to: -6 } as const;

/**
 * Thời lượng cú bay từ phong bì về chỗ đậu ở hero.
 *
 * Là hằng số dùng chung vì *hai* timeline phải khớp nhau ở đúng khoảnh khắc
 * này: `loadingTimeline` cất tấm thiệp trong phong bì đi, `heroRevealTimeline`
 * bật tấm thiệp của hero lên. Lệch nhau một quãng — như bản trước, hero hiện
 * sớm 60ms rồi hai tấm cùng nằm đó thêm 190ms — là thấy bóng đổ, vân giấy và
 * ánh kim nhũ nhân đôi rồi đột ngột nhẹ lại: đúng cái nháy ở khoảnh khắc thiệp
 * đáp xuống.
 */
const HANDOFF_DURATION = 0.82;

/**
 * Quãng chồng lấp cho phép giữa hai tấm thiệp, tính bằng giây (~2 frame).
 *
 * Không cắt về 0 vì hai timeline là hai đối tượng khác nhau: chốt cùng một mốc
 * tuyệt đối thì vẫn có khả năng chúng rơi vào hai tick liền nhau, và thà thừa
 * hai frame chồng khít lên nhau (lúc này tween đã kết thúc nên hai tấm trùng
 * tuyệt đối) còn hơn một frame trống không có tấm thiệp nào.
 */
const HANDOFF_OVERLAP = 0.04;

/** Mobile reveals the UI as soon as the seal finishes its three shakes. */
const MOBILE_REVEAL_AT = CUE.open + 0.67;

/**
 * Nhịp chuyển cảnh của điện thoại, tính từ lúc niêm sáp rời mặt giấy.
 *
 * Máy nhỏ không mở nắp, không rút thiệp, không có cú bay — cảnh dừng lại ở chỗ
 * niêm sáp rời đi. Nhưng nó vẫn phải *tan* chứ không tắt: phong bì lui lại một
 * nhịp, nền đen tan ra để hero lộ dần từ phía sau, và chữ vào khi nền còn đang
 * tan. Ba mốc lệch nhau là thứ duy nhất tạo ra chiều sâu ở đây; chốt chung một
 * mốc thì mọi lớp cùng đổi trong một frame và người xem đọc ra một cú cắt.
 */
const MOBILE = {
  /** Phong bì và quầng sáng lui đi. */
  envelopeOut: MOBILE_REVEAL_AT + 0.12,
  /** Nền đen bắt đầu tan. */
  backdropOut: MOBILE_REVEAL_AT + 0.28,
  /** Hero vào *trong lúc* nền còn đang tan — hai lớp hoà vào nhau. */
  contentIn: MOBILE_REVEAL_AT + 0.38,
  /** Đủ dài để cú tan đọc ra là tan, chưa đủ dài để thành một quãng chờ. */
  backdropDuration: 0.6,
} as const;

/** Độ nghiêng cuối của tấm thiệp. Phải khớp `rotate-[-2deg]` của thiệp trong hero. */
const CARD_TILT = -2;

/** Rút gọn cho lần quay lại trong cùng phiên (~650ms). */
const SHORT_FADE = 0.55;

/**
 * Tablet/mobile chỉ nhanh hơn nhẹ để cảnh vẫn có độ thở nhưng không giữ người
 * dùng quá lâu. Cảnh đầy đủ 5s, trên máy nhỏ còn khoảng 4.35s.
 */
const COMPACT_TIME_SCALE = 1.15;

/** Giới hạn tương tác con trỏ trên desktop. Tablet dùng một nửa. */
const POINTER = { rotateX: 3, rotateY: 5, shift: 8 } as const;

type Props = {
  children: ReactNode;
};

/**
 * Đạo diễn của chương mở đầu homepage.
 *
 * Client Component duy nhất của cảnh: mọi chữ, nút và link đều do Server
 * Component bên ngoài render rồi truyền vào `children`, ở đây chỉ có chuyển
 * động. Các phần tử được tìm qua `data-*` nên component này không cần biết bố
 * cục hero trông như thế nào.
 *
 * Bốn timeline tách rời, mỗi cái một trách nhiệm, thay vì một timeline khổng
 * lồ — timeline cuộn phải sống suốt vòng đời trang, còn hai timeline mở màn
 * chỉ chạy một lần và phải bỏ được giữa chừng khi người dùng bấm phím.
 */
export function HeroStage({ children }: Props) {
  const { lockScroll, unlockScroll } = useSmoothScroll();

  const scope = useGsapContext<HTMLDivElement>(({ tier, scope: root }) => {
    const select = <T extends HTMLElement>(selector: string) =>
      root.querySelector<T>(selector);

    const loader = select("[data-reveal-loader]");
    const scrollWrap = select("[data-reveal-card-scroll]");
    const cardWrap = select("[data-reveal-card-wrap]");
    // Có *hai* tấm thiệp trong cây: một trong phong bì của màn mở đầu, một ở
    // hero. Chúng dùng chung component nên cùng bộ `data-*`, và tấm trong
    // loader đứng trước trong DOM — tìm từ gốc là trúng nhầm tấm đã bị ẩn.
    const card = cardWrap?.querySelector<HTMLElement>("[data-reveal-card]") ?? null;
    const portrait = select("[data-reveal-portrait]");
    const envelopeCue = select("[data-reveal-envelope-flap]");
    const chapterMarker = select("[data-reveal-chapter-marker]");
    const chapterRule = select("[data-reveal-chapter-rule]");
    const items = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll("[data-reveal-item]"),
    );
    // Header là component dùng chung của mọi trang; chương mở đầu chỉ mượn nó
    // trong đúng vài trăm ms đầu rồi trả lại nguyên trạng.
    const nav = document.querySelector<HTMLElement>("header");

    if (!scrollWrap || !cardWrap) return;

    const mode = readIntroMode();
    const compact = tier !== "full";
    // Match the hero layout breakpoint, independently of device motion tier.
    const flyCard = window.matchMedia("(min-width: 1024px)").matches;

    /* ---------------------------------------------------------------------
       Nhánh reduced-motion: không phong bì, không 3D, không camera. Chỉ một cú
       fade 250ms và trả lại quyền cuộn ngay — không có độ trễ nào.
       ------------------------------------------------------------------ */
    if (tier === "none") {
      if (loader) loader.style.display = "none";
      gsap.set(cardWrap, { opacity: 1 });
      gsap.to([...items, nav].filter(Boolean), {
        opacity: 1,
        duration: 0.25,
        ease: "none",
      });
      completeIntro();
      return;
    }

    let finished = mode === null;
    /**
     * Ba việc dọn dẹp cuối cảnh, **rải ra ba frame** thay vì gọi liền một mạch.
     *
     * Cả ba đều đắt và đều đụng tới cả document: mở cuộn ghi lại `overflow` của
     * `<html>` rồi khởi động lại vòng nội suy của Lenis; `completeIntro` gỡ
     * `data-intro` mà mọi quy tắc trong `globals.css` chọn theo nó là selector
     * hậu duệ từ `<html>`, nên phải tính lại style của toàn trang; còn
     * `ScrollTrigger.refresh` đọc lại bố cục của *mọi* trigger trên trang chủ
     * một cách đồng bộ. Gọi cả ba trong một frame — mà frame đó lại đúng là
     * frame tấm thiệp vừa đáp xuống và lớp loader vừa bị gỡ — cho ra một long
     * task duy nhất, và người xem đọc nó thành cú khựng một nhịp.
     *
     * Thứ tự ưu tiên theo cảm nhận của người dùng: trả quyền cuộn ngay, hai
     * việc còn lại không ai nhìn thấy nên lùi được.
     */
    let cleanupFrame = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      unlockScroll();
      cleanupFrame = requestAnimationFrame(() => {
        completeIntro();
        cleanupFrame = requestAnimationFrame(() => {
          // Bố cục vừa đổi (khoá cuộn → mở cuộn), ScrollTrigger cần đo lại.
          cleanupFrame = 0;
          ScrollTrigger.refresh();
        });
      });
    };

    let loadingTimeline: gsap.core.Timeline | null = null;
    let heroRevealTimeline: gsap.core.Timeline | null = null;

    if (mode === null) {
      // Cảnh đã chạy xong ở lần dựng trước (đổi tier, xoay màn hình).
      if (loader) loader.style.display = "none";
      gsap.set([...items, nav, cardWrap].filter(Boolean), { opacity: 1, y: 0 });
    } else {
      lockScroll();

      const handoff =
        mode === "full" && loader && flyCard
          ? measureHandoff(root, cardWrap)
          : null;

      loadingTimeline =
        mode === "short"
          ? buildShortLoadingTimeline(loader)
          : buildLoadingTimeline(root, loader, handoff, flyCard);

      heroRevealTimeline = buildHeroRevealTimeline({
        mode,
        flyCard,
        cardWrap,
        items,
        nav,
      });
      // Trả quyền cuộn ngay khi lớp loader rời màn hình. Phần chữ có thể tiếp
      // tục settle thêm vài nhịp mà không giữ người dùng chờ hết stagger.
      loadingTimeline.eventCallback("onComplete", finish);

      if (compact) {
        loadingTimeline?.timeScale(COMPACT_TIME_SCALE);
        heroRevealTimeline.timeScale(COMPACT_TIME_SCALE);
      }
    }

    /* ---------------------------------------------------------------------
       Bỏ qua cảnh khi người dùng bắt đầu điều hướng bằng bàn phím. Lớp loader
       đã `inert` nên không giữ được focus, nhưng nếu ai đó tab vào một nút
       đang nằm dưới lớp phủ thì phải thấy nó ngay lập tức.
       ------------------------------------------------------------------ */
    const skipIntro = () => {
      loadingTimeline?.progress(1);
      heroRevealTimeline?.progress(1);
      finish();
    };
    window.addEventListener("keydown", skipIntro, { once: true });
    window.addEventListener("focusin", skipIntro, { once: true });
    window.addEventListener("wheel", skipIntro, { once: true, passive: true });
    window.addEventListener("touchmove", skipIntro, {
      once: true,
      passive: true,
    });

    /* --- heroScrollTimeline --------------------------------------------
       15–20% cuộn đầu tiên: chữ lùi lại, thiệp tiến về giữa khung hình và
       dựng nhẹ về phía người xem. `scrub` để chuyển động bám đúng tay người
       cuộn — không còn một đường cắt ngang cần phải giải thích.
       ------------------------------------------------------------------ */
    const heroScrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "18% top",
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });

    // `fromTo` + `immediateRender: false` chứ không phải `to`: với `to`, GSAP
    // chốt giá trị đầu ở lần render đầu tiên của timeline. Nếu lần đó rơi vào
    // lúc cảnh mở màn còn đang fade chữ (opacity ~0), thì "đầu" bị ghi là ~0 —
    // và mỗi lần người xem cuộn ngược lên đỉnh, cả cột chữ biến mất thay vì
    // hiện lại. Ghi rõ cả hai đầu là hết phụ thuộc vào thời điểm.
    heroScrollTimeline
      .fromTo(
        items,
        { opacity: 1, y: 0 },
        { opacity: 0.45, y: -20, ease: "none", immediateRender: false },
        0,
      )
      .to(
        scrollWrap,
        {
          xPercent: compact ? -5 : -16,
          yPercent: compact ? 2 : 1,
          scale: compact ? 1.02 : 1.05,
          rotation: compact ? -1 : 0,
          ease: "none",
        },
        0,
      );
    if (chapterMarker) {
      // Nhãn chương đi nhanh hơn phần nội dung một nhịp để tạo chiều sâu rõ
      // ràng khi cuộn, thay vì cả cột chữ trôi như một khối phẳng.
      heroScrollTimeline.fromTo(
        chapterMarker,
        { y: 0, x: 0, opacity: 1 },
        {
          y: -42,
          x: compact ? 0 : -8,
          opacity: 0.18,
          ease: "none",
          immediateRender: false,
        },
        0,
      );
    }
    if (chapterRule) {
      heroScrollTimeline.fromTo(
        chapterRule,
        { scaleX: 1, opacity: 1 },
        { scaleX: 1.75, opacity: 0.45, ease: "none", immediateRender: false },
        0,
      );
    }
    if (envelopeCue) {
      // Nắp phong thư của cue là một `<g>` trong SVG, mà GSAP dựng transform
      // cho SVG bằng ma trận 2D — `rotateX` sẽ bị bỏ qua không một tiếng động.
      // Lật `scaleY` quanh cạnh trên cho ra đúng chuyển động đó bằng 2D.
      gsap.set(envelopeCue, { transformOrigin: "50% 0%" });
      heroScrollTimeline.to(envelopeCue, { scaleY: -1, ease: "none" }, 0);
    }

    // ScrollTrigger tự render progress 0 ngay khi khởi tạo, nên timeline trên
    // vừa kéo chữ về trạng thái "đã hiện". Trả lại trạng thái ẩn cho cảnh mở
    // màn — nếu không, chữ đứng sẵn ở đó và cú vào sân khấu theo stagger mất
    // sạch.
    if (mode !== null && items.length > 0) {
      gsap.set(items, { opacity: 0, y: 16 });
    }

    /* --- heroPointerInteraction ---------------------------------------- */
    const cleanupPointer = attachPointer({ tier, cardWrap, card, portrait });

    return () => {
      window.removeEventListener("keydown", skipIntro);
      window.removeEventListener("focusin", skipIntro);
      window.removeEventListener("wheel", skipIntro);
      window.removeEventListener("touchmove", skipIntro);
      cleanupPointer();
      if (cleanupFrame) cancelAnimationFrame(cleanupFrame);
      heroScrollTimeline.scrollTrigger?.kill();
      // Nếu component bị tháo giữa lúc cảnh đang chạy thì tuyệt đối không được
      // để trang kẹt ở trạng thái khoá cuộn.
      unlockScroll();
    };
  });

  return (
    <div ref={scope} className="relative">
      {children}
    </div>
  );
}

/* ===========================================================================
   Đo phép chuyển giao giữa tấm thiệp trong phong bì và tấm thiệp của hero
   ======================================================================== */

type Handoff = {
  /** Tỉ lệ thu nhỏ phong bì để tấm thiệp bên trong bằng đúng thiệp của hero. */
  scale: number;
  /** Quãng dời thêm để hai tấm thiệp trùng khít nhau. */
  x: number;
  y: number;
};

/**
 * Cuối cảnh, tấm thiệp trong phong bì phải đáp xuống *đúng* chỗ tấm thiệp của
 * hero rồi mới đổi vai — lệch vài pixel là người xem thấy hai vật thể thay vì
 * một.
 *
 * Đo lúc chạy chứ không tính bằng số cứng: cả hai đều co giãn theo viewport
 * (`clamp`, `vw`, `vh`), nên chỉ có trình duyệt mới biết chúng thật sự to bao
 * nhiêu. Thời điểm gọi hàm này chưa có transform nào được đặt, nên số đo là bố
 * cục thuần.
 */
function measureHandoff(root: HTMLElement, heroCard: HTMLElement): Handoff | null {
  const slot = root.querySelector<HTMLElement>("[data-loader-card]");
  if (!slot) return null;

  const from = slot.getBoundingClientRect();
  const to = heroCard.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) return null;

  // Chỗ tấm thiệp đứng sau khi đã nhô hẳn ra khỏi phong bì.
  const risenTop = from.top + (CARD_RISE.to / 100) * from.height;
  const risen = {
    x: from.left + from.width / 2,
    y: risenTop + from.height / 2,
  };

  // Phong bì được ghim giữa màn hình, nên gốc phóng to của nó là tâm viewport.
  const origin = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const scale = to.width / from.width;
  return {
    scale,
    x: to.left + to.width / 2 - (origin.x + (risen.x - origin.x) * scale),
    y: to.top + to.height / 2 - (origin.y + (risen.y - origin.y) * scale),
  };
}

/* ===========================================================================
   loadingTimeline
   ======================================================================== */

/** Cảnh đầy đủ: chữ ký brand → phong bì → mở nắp → ảnh nở kín khung. */
function buildLoadingTimeline(
  root: HTMLElement,
  loader: HTMLElement | null,
  handoff: Handoff | null,
  flyCard: boolean,
) {
  const tl = gsap.timeline();
  if (!loader) return tl;

  const pick = <T extends HTMLElement>(selector: string) =>
    root.querySelector<T>(selector);

  const backdrop = pick("[data-loader-backdrop]");
  const brand = pick("[data-loader-brand]");
  const tagline = pick("[data-loader-tagline]");
  const halo = pick("[data-loader-halo]");
  const stage = pick("[data-loader-stage]");
  const slot = pick("[data-loader-card]");
  const flap = pick("[data-loader-flap]");
  const seal = pick("[data-loader-seal]");
  // `window` là tên toàn cục — đặt gạch dưới thay vì đổi tên `data-*`.
  const window_ = pick("[data-loader-window]");

  /* --- Khung 1 — Keemori ký tên trước khi câu chuyện bắt đầu ------------ */
  if (brand) {
    tl.fromTo(
      brand,
      { opacity: 0, scale: 1.02 },
      { opacity: 1, scale: 1, duration: 0.46, ease: "power2.out" },
      CUE.brand,
    );
  }
  if (tagline) {
    tl.fromTo(
      tagline,
      { opacity: 0, y: 7, letterSpacing: "0.42em" },
      {
        opacity: 1,
        y: 0,
        letterSpacing: "0.32em",
        duration: 0.42,
        ease: "power2.out",
      },
      CUE.brand + 0.18,
    );
  }
  if (brand) {
    tl.to(
      brand,
      { opacity: 0, duration: 0.3, ease: "power2.in" },
      CUE.envelope - 0.18,
    );
  }

  /* --- Khung 2 — phong bì hiện ra dưới quầng sáng ----------------------- */
  if (stage) {
    tl.fromTo(
      stage,
      { opacity: 0, scale: 0.86, rotateX: 5 },
      {
        opacity: 1,
        scale: 1,
        rotateX: 0,
        duration: 0.68,
        ease: "power3.out",
      },
      CUE.envelope,
    );
  }
  if (halo) {
    tl.fromTo(
      halo,
      { opacity: 0, scale: 0.78 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.72,
        ease: "power2.out",
      },
      CUE.envelope - 0.04,
    );
  }

  /* --- Khung 3 — xoay dấu sáp, mở nắp, thiệp nhô ra --------------------- */
  if (seal) {
    // Ba nhịp xoay nhỏ tạo cảm giác con dấu đang được tháo khỏi mép phong bì,
    // sau đó mới rời khỏi mặt giấy. Biên độ thấp để vẫn có trọng lượng thật.
    tl.to(
      seal,
      { rotation: -14, scale: 1.08, duration: 0.22, ease: "power2.out" },
      CUE.open,
    )
      .to(
        seal,
        { rotation: 9, scale: 1.12, duration: 0.25, ease: "power1.inOut" },
        CUE.open + 0.22,
      )
      .to(
        seal,
        { rotation: -4, scale: 1.07, duration: 0.2, ease: "power1.inOut" },
        CUE.open + 0.47,
      )
      .to(
        seal,
        {
          opacity: 0,
          rotation: 18,
          scale: 0.74,
          duration: 0.36,
          ease: "power2.in",
        },
        CUE.open + 0.67,
      );
  }
  if (!flyCard) {
    // Keep the envelope and seal choreography, then reveal the complete UI.
    // No flap opening, rising card, photo window, or flight on mobile.
    //
    // Tấm thiệp vẫn phải nằm *trong* túi giấy. Vị trí nghỉ đó chỉ do cú
    // `fromTo` của nhánh desktop đặt (`fromTo` render ngay lúc dựng timeline),
    // nên nhánh này thoát sớm là tấm thiệp đứng ở `yPercent: 0` — thò hẳn lên
    // trên một chiếc phong bì còn nguyên niêm.
    if (slot) gsap.set(slot, { yPercent: CARD_RISE.from });

    // Phong bì lui về phía người xem rồi mờ đi, thay vì đứng yên nguyên cỡ
    // trong lúc cả lớp loader nhạt dần — một vật thể rời khỏi khung hình đọc
    // ra khác hẳn một tấm ảnh bị giảm độ đục.
    if (stage) {
      tl.to(
        stage,
        {
          opacity: 0,
          scale: 1.05,
          y: -10,
          duration: 0.52,
          ease: "power2.inOut",
        },
        MOBILE.envelopeOut,
      );
    }
    if (halo) {
      tl.to(
        halo,
        { opacity: 0, scale: 1.14, duration: 0.5, ease: "power2.in" },
        MOBILE.envelopeOut,
      );
      // `filter: blur(24px)` trên một khối rộng 110vw: gỡ ngay khi vô hình.
      tl.set(halo, { display: "none" }, MOBILE.envelopeOut + 0.5);
    }
    if (backdrop) {
      tl.to(
        backdrop,
        {
          opacity: 0,
          duration: MOBILE.backdropDuration,
          ease: "power2.inOut",
        },
        MOBILE.backdropOut,
      );
      // Cùng lý do với nhánh desktop: `.paperTexture` bên trong nền dùng
      // `mix-blend-mode: overlay` phủ kín khung nhìn, nên mỗi frame nó còn tồn
      // tại là một lần blend lại cả màn hình — đúng quãng máy đang bận nhất.
      tl.set(
        backdrop,
        { display: "none" },
        MOBILE.backdropOut + MOBILE.backdropDuration,
      );
    }
    tl.set(
      loader,
      { display: "none" },
      MOBILE.backdropOut + MOBILE.backdropDuration,
    );
    return tl;
  }

  if (flap) {
    // Bản lề phải nằm ở mép trên. GSAP tự ghi `transform-origin` khi nó nhận
    // quản lý transform, và mặc định của nó là tâm phần tử — không đặt lại ở
    // đây thì nắp lật quanh chính giữa và úp ngược lên miệng phong bì.
    gsap.set(flap, { transformOrigin: "top center" });
    tl.to(
      flap,
      { rotateX: -168, duration: 0.96, ease: "power2.inOut" },
      CUE.open + 0.66,
    );
    // Nắp đã lật quá phương thẳng đứng thì phải nằm sau tấm thiệp — nhưng vẫn
    // trên lòng phong bì, nếu không nó biến mất thay vì dựng lên phía sau.
    tl.set(flap, { zIndex: 1 }, CUE.open + 1.02);
  }
  if (slot) {
    tl.fromTo(
      slot,
      { yPercent: CARD_RISE.from },
      {
        yPercent: CARD_RISE.to,
        duration: 0.92,
        ease: "power2.out",
      },
      CUE.open + 0.9,
    );
  }
  if (window_) {
    // Thân tấm thiệp tan dần thành bức ảnh cưới — tấm thiệp làm mặt nạ.
    tl.fromTo(
      window_,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" },
      // Chừa hơn nửa giây để người xem đọc được mặt giấy trước khi nó trở
      // thành cửa sổ ảnh — đúng nhịp "mở thiệp rồi mới bước vào câu chuyện".
      CUE.open + 1.55,
    );
  }

  /* --- Khung 4 — ảnh nở kín khung, thiệp về chỗ ------------------------- */
  if (window_) {
    tl.to(
      window_,
      { opacity: 0, duration: 0.42, ease: "power2.in" },
      CUE.compose + 0.08,
    );
  }
  // Phong bì lui đi, chỉ còn tấm thiệp bay về vị trí cuối.
  tl.to(
    [pick("[data-loader-env-front]"), flap, pick("[data-loader-env-inside]")].filter(
      Boolean,
    ),
    { opacity: 0, duration: 0.45, ease: "power2.in" },
    CUE.compose,
  );
  if (stage && handoff) {
    tl.to(
      stage,
      {
        scale: handoff.scale,
        x: handoff.x,
        y: handoff.y,
        duration: HANDOFF_DURATION,
        ease: "power3.inOut",
      },
      CUE.compose,
    );
  }
  if (stage) {
    // Tấm thiệp của hero đã lên thay chỗ (`heroRevealTimeline` chốt cùng mốc
    // này). Cất tấm đang diễn đi ngay thay vì để nó nằm chồng lên tới hết cảnh.
    // Ngoài `if` của `handoff` là cố ý: đo hụt thì cú bay không xảy ra, nhưng
    // hai tấm thiệp chồng nhau lại càng phải tránh.
    tl.set(
      stage,
      { visibility: "hidden" },
      CUE.compose + HANDOFF_DURATION + HANDOFF_OVERLAP,
    );
  }
  if (slot) {
    // Nghiêng đúng bằng độ nghiêng của tấm thiệp trong hero, quay quanh chính
    // tâm nó — hai tấm khớp nhau tuyệt đối ở khoảnh khắc đổi vai.
    tl.to(
      slot,
      { rotate: CARD_TILT, duration: HANDOFF_DURATION, ease: "power3.inOut" },
      CUE.compose,
    );
  }
  if (backdrop) {
    tl.to(
      backdrop,
      { opacity: 0, duration: 0.7, ease: "power2.inOut" },
      CUE.compose,
    );
    // Nền là lớp đắt nhất của cảnh: phủ kín khung nhìn, và `.paperTexture` bên
    // trong nó dùng `mix-blend-mode: overlay` nên mỗi frame trình duyệt phải
    // blend lại toàn màn hình với bức ảnh cưới nằm dưới. Gỡ ngay khi nó vô
    // hình — không đợi tới `display:none` của cả lớp loader, vốn rơi đúng vào
    // frame bận nhất.
    tl.set(backdrop, { display: "none" }, CUE.compose + 0.7);
  }
  if (halo) {
    tl.to(
      halo,
      { opacity: 0, scale: 1.18, duration: 0.58, ease: "power2.in" },
      CUE.compose,
    );
    // Cùng lý do, cộng thêm `filter: blur(24px)` trên một khối rộng 64vw.
    tl.set(halo, { display: "none" }, CUE.compose + 0.58);
  }

  tl.set(loader, { display: "none" }, CUE.end);
  return tl;
}

/** Lần quay lại trong cùng phiên: chỉ hé màn, không kể lại cả cảnh. */
function buildShortLoadingTimeline(loader: HTMLElement | null) {
  const tl = gsap.timeline();
  if (!loader) return tl;

  tl.set(loader, { opacity: 1 })
    .to(loader, { opacity: 0, duration: SHORT_FADE, ease: "power2.out" }, 0)
    .set(loader, { display: "none" });
  return tl;
}

/* ===========================================================================
   heroRevealTimeline
   ======================================================================== */

function buildHeroRevealTimeline({
  mode,
  flyCard,
  cardWrap,
  items,
  nav,
}: {
  mode: "full" | "short";
  flyCard: boolean;
  cardWrap: HTMLElement;
  items: HTMLElement[];
  nav: HTMLElement | null;
}) {
  const short = mode === "short";
  if (!short && !flyCard) {
    // Hero vào giữa lúc nền đen của loader còn đang tan, và vào theo lớp —
    // header, tấm thiệp, rồi cột chữ. Bật thẳng `opacity: 1` cho cả ba ở một
    // mốc duy nhất như bản trước là cả màn hình đổi trong đúng một frame, ngay
    // dưới một lớp nền vẫn còn đục: đó chính là cú cắt.
    const mobileTl = gsap.timeline({ delay: MOBILE.contentIn });
    if (nav) {
      mobileTl.fromTo(
        nav,
        { opacity: 0, y: -14 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
        0,
      );
    }
    mobileTl.fromTo(
      cardWrap,
      { opacity: 0, scale: 0.985 },
      { opacity: 1, scale: 1, duration: 0.6, ease: EASE.reveal },
      0,
    );
    if (items.length > 0) {
      mobileTl.fromTo(
        items,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: EASE.reveal,
          stagger: 0.04,
        },
        0.06,
      );
    }
    return mobileTl;
  }
  const lead = 0.08;
  const tl = gsap.timeline({ delay: short ? 0.1 : CUE.compose - lead });

  if (short) {
    tl.fromTo(
      cardWrap,
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.5, ease: EASE.reveal },
      0,
    );
  } else {
    // Tấm thiệp của hero chỉ hiện lên khi tấm thiệp trong phong bì đã đáp đúng
    // chỗ nó — không fade, không dịch, chỉ đổi vai trong một khung hình. Mốc
    // phải quy về đúng cùng thời điểm tuyệt đối với cú `set(visibility)` bên
    // `loadingTimeline`, nên tính từ `HANDOFF_DURATION` chứ không viết số cứng.
    tl.set(cardWrap, { opacity: 1 }, HANDOFF_DURATION + lead);
  }

  if (nav) {
    tl.fromTo(
      nav,
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: 0.62, ease: "power2.out" },
      short ? 0 : 0,
    );
  }
  if (items.length > 0) {
    tl.fromTo(
      items,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: short ? 0.44 : 0.62,
        ease: EASE.reveal,
        stagger: short ? 0.04 : 0.035,
      },
      short ? 0.05 : 0.04,
    );
  }

  return tl;
}

/* ===========================================================================
   heroPointerInteraction
   ======================================================================== */

function attachPointer({
  tier,
  cardWrap,
  card,
  portrait,
}: {
  tier: MotionTier;
  cardWrap: HTMLElement;
  card: HTMLElement | null;
  portrait: HTMLElement | null;
}): () => void {
  // Thiết bị cảm ứng không có con trỏ để đi theo — bật lên chỉ tổ giật.
  if (!window.matchMedia("(pointer: fine)").matches) return () => {};

  // Tablet giảm một nửa biên độ xoay và trôi.
  const gain = tier === "full" ? 1 : 0.5;

  const to = (target: gsap.TweenTarget, prop: string, duration: number) =>
    gsap.quickTo(target, prop, { duration, ease: "power3" });

  // Tên chính tắc của GSAP là `rotationX`/`rotationY`. Bí danh `rotateX` chỉ
  // dùng được với `gsap.to`; đưa vào `quickTo` thì GSAP không tách nổi thuộc
  // tính transform tổng hợp và cảnh báo trên mỗi lần con trỏ nhúc nhích.
  const cardRotateX = to(cardWrap, "rotationX", 0.7);
  const cardRotateY = to(cardWrap, "rotationY", 0.7);
  const cardX = to(cardWrap, "x", 0.7);
  const cardY = to(cardWrap, "y", 0.7);
  // Ánh kim nhũ chạy chậm hơn thân thiệp một chút, nên nó đọc ra là ánh phản
  // chiếu trượt trên mặt giấy chứ không phải một lớp dán chặt vào thiệp.
  const foil = card ? to(card, "--foil-x", 0.9) : null;
  // Ảnh cưới đi chậm hơn thiệp — chênh tốc độ là thứ tạo ra chiều sâu.
  const portraitX = portrait ? to(portrait, "x", 1.1) : null;
  const portraitY = portrait ? to(portrait, "y", 1.1) : null;

  const apply = (nx: number, ny: number) => {
    cardRotateX(-ny * POINTER.rotateX * gain);
    cardRotateY(nx * POINTER.rotateY * gain);
    cardX(nx * POINTER.shift * gain);
    cardY(ny * POINTER.shift * gain);
    foil?.(nx * 0.5 + 0.5);
    portraitX?.(nx * POINTER.shift * 0.55 * gain);
    portraitY?.(ny * POINTER.shift * 0.55 * gain);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (document.hidden) return;
    apply(
      (event.clientX / window.innerWidth - 0.5) * 2,
      (event.clientY / window.innerHeight - 0.5) * 2,
    );
  };

  const reset = () => apply(0, 0);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  // Con trỏ rời cửa sổ, hoặc tab bị ẩn: về vị trí nghỉ thay vì đứng nghiêng.
  document.addEventListener("pointerleave", reset);
  document.addEventListener("visibilitychange", reset);

  return () => {
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerleave", reset);
    document.removeEventListener("visibilitychange", reset);
  };
}
