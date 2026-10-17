"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMotionTier } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

/** Tốc độ dải tự chạy (px/giây) — đủ chậm để đọc được tên từng tấm. */
const SPEED = 42;

/** Hệ số làm mượt lúc dải dừng lại / chạy lại (mỗi khung hình). */
const RATE_EASE = 0.12;

/** Thời gian một cú bấm nút nhích dải đi một tấm (ms). */
const NUDGE_DURATION = 520;

/** Dải đứng yên bấy nhiêu ms sau khi người xem thôi cuộn/vuốt/bấm nút. */
const RESUME_DELAY = 1400;

/** Bề rộng tối thiểu của con trượt trên thanh tiến độ (px). */
const THUMB_MIN = 12;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

type Props<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Bề rộng một tấm; khoảng cách giữa hai tấm là `pr-*` của chính nó. */
  itemClassName: string;
  /** Nhãn vùng cuộn cho trình đọc màn hình. */
  label: string;
  prevLabel: string;
  nextLabel: string;
  /**
   * Dải tự chạy, lặp vô tận. Tắt thì khối là slider lật theo trang, đứng yên
   * cho tới khi người xem bấm hoặc cuộn.
   */
  autoplay?: boolean;
  /** Dải tràn hết bề ngang màn hình; phần đầu khối vẫn nằm trong container. */
  bleed?: boolean;
};

/**
 * Dải card ngang dùng chung cho trang chủ: **mẫu thiệp nổi bật** (tự chạy,
 * tràn width) và **thiệp của các cặp đôi** (lật theo trang, trong container).
 *
 * Chỉ có một cơ chế: **cuộn thật của trình duyệt**. Chuột, trackpad, vuốt tay
 * và phím mũi tên đều dùng được sẵn, và lúc dải đứng yên thì không có gì để
 * tính.
 *
 * Tự chạy dựng trên chính vùng cuộn đó: danh sách được nhân đôi, mỗi khung
 * hình cộng thêm `SPEED` px vào `scrollLeft`, và khi đi hết một bản thì trừ
 * đúng chiều rộng một bản — điểm quay lại rơi vào chỗ nội dung trùng khít nên
 * mắt không thấy.
 *
 * Luật quan trọng nhất của vòng lặp: **tại mỗi thời điểm chỉ một bên được ghi
 * `scrollLeft`**. Hai bản trước để vòng lặp tiếp tục ghi (dù chậm dần) trong lúc
 * `scrollBy({ behavior: "smooth" })` hoặc quán tính vuốt tay đang chạy — mỗi
 * lần ghi huỷ cú cuộn kia, nên nút bấm thấy lag và vuốt thấy giật. Giờ:
 * - Bấm nút: nhích một tấm bằng tween của chính vòng lặp, không dùng cuộn mượt
 *   của trình duyệt (thời lượng của nó không đo được nên không biết lúc nào
 *   được ghi lại).
 * - Người xem cuộn/vuốt: phát hiện qua `scroll` mà giá trị khác lần ghi cuối,
 *   vòng lặp buông hẳn tới khi hết quán tính thêm `RESUME_DELAY`.
 *
 * `prefers-reduced-motion` thì không nhân đôi và không chạy — dải trở lại đúng
 * slider lật tay, tức nhánh `autoplay = false`.
 *
 * Thanh tiến độ vẽ bằng DOM trực tiếp, không qua state: nó đổi ở mọi khung
 * hình cuộn, mà mỗi lần setState là render lại toàn bộ card ảnh. Ở dải lặp,
 * thanh đầy dần tới 100% rồi về lại đầu, khớp đúng một vòng của dải.
 */
export function CardRail<T>({
  items,
  getKey,
  renderItem,
  itemClassName,
  label,
  prevLabel,
  nextLabel,
  autoplay = false,
  bleed = false,
}: Props<T>) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const nudgeRef = useRef<((direction: 1 | -1) => void) | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const tier = useMotionTier();
  // `tier === null` ở lần render đầu (kể cả trên server) nên markup SSR và
  // client khớp nhau: bản sao chỉ được gắn vào sau khi mount.
  const looping = autoplay && tier !== null && tier !== "none";

  /**
   * Tô thanh tiến độ từ mép trái. `span` là chiều dài nội dung (một bản ở dải
   * lặp, cả vùng cuộn ở slider).
   *
   * Dải lặp: đầy dần theo vị trí trong một bản, chạm 100% thì về lại đầu —
   * đúng lúc vòng lặp quay về bản thứ nhất. Slider: tính cả phần đang nhìn
   * thấy, nên lúc đứng đầu thanh đã có sẵn một đoạn và tới cuối là đầy.
   * Luôn giữ tối thiểu `THUMB_MIN` px để thanh không bao giờ trống trơn.
   */
  const paint = useCallback(
    (offset: number, span: number, visibleWidth: number, wrap: boolean) => {
      const barElement = bar.current;
      const fill = fillRef.current;
      if (!barElement || !fill || span <= 0) return;
      const width = barElement.clientWidth;
      if (width <= 0) return;

      const ratio = wrap
        ? (((offset % span) + span) % span) / span
        : (offset + visibleWidth) / span;
      const scale = Math.min(Math.max(ratio, THUMB_MIN / width), 1);
      fill.style.transform = `scaleX(${scale})`;
    },
    [],
  );

  const sync = useCallback(() => {
    const element = viewport.current;
    if (!element) return;
    const max = element.scrollWidth - element.clientWidth;
    const start = element.scrollLeft <= 1;
    const end = max <= 0 || element.scrollLeft >= max - 1;
    paint(element.scrollLeft, element.scrollWidth, element.clientWidth, false);
    setEdges((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  }, [paint]);

  useLayoutEffect(() => {
    if (looping) return;
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [looping, sync]);

  useEffect(() => {
    const element = viewport.current;
    const list = track.current;
    if (!looping || !element || !list) return;

    let frame = 0;
    let last = 0;
    let rate = 0;
    // Vị trí giữ bằng số thực ở đây, không đọc lại từ `scrollLeft`: trình
    // duyệt làm tròn giá trị đó, mà mỗi khung hình dải chỉ nhích chưa tới 1px.
    let position = element.scrollLeft;
    let written = position;
    let visible = false;
    let hovering = false;
    let focused = false;
    let pressing = false;
    let holdUntil = 0;
    let nudge: { from: number; to: number; start: number } | null = null;

    const cycleWidth = () => list.scrollWidth / 2;

    const write = (value: number) => {
      position = value;
      written = value;
      element.scrollLeft = value;
    };

    const hold = () => {
      holdUntil = performance.now() + RESUME_DELAY;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(element);

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      if (nudge) {
        // Đọc trước, ghi sau: đọc `scrollWidth` sau khi đã ghi style là ép
        // trình duyệt tính lại layout giữa khung hình.
        const cycle = cycleWidth();
        const t = Math.min((now - nudge.start) / NUDGE_DURATION, 1);
        write(nudge.from + (nudge.to - nudge.from) * easeOutCubic(t));
        if (t === 1) nudge = null;
        rate = 0;
        paint(position, cycle, element.clientWidth, true);
        return;
      }

      if (pressing || now < holdUntil) {
        rate = 0;
        return;
      }

      const running = !hovering && !focused && visible && !document.hidden;
      rate += ((running ? 1 : 0) - rate) * RATE_EASE;
      if (rate < 0.001) return;

      // Chiều rộng một bản đo lại mỗi khung hình: ảnh tải muộn hay đổi
      // breakpoint đều làm số này khác đi, chốt một lần là vòng lặp lệch.
      const cycle = cycleWidth();
      if (cycle <= 0) return;

      let next = position + SPEED * rate * delta;
      if (next >= cycle) next -= cycle;
      write(next);
      paint(position, cycle, element.clientWidth, true);
    };

    frame = requestAnimationFrame(tick);

    nudgeRef.current = (direction) => {
      const cycle = cycleWidth();
      const card = list.querySelector<HTMLElement>("[data-rail-item]");
      const size = card?.getBoundingClientRect().width ?? element.clientWidth;
      if (cycle <= 0 || size <= 0) return;

      // Bấm liên tiếp thì cộng dồn từ đích của cú trước, không từ chỗ đang
      // đứng giữa đường — không thì bấm nhanh hai lần chỉ đi được một tấm.
      // Đích luôn khớp mép một tấm; hệ số 0.2 để tấm gần như đã tới mép vẫn
      // tính là một bước, không nhích vài px rồi dừng.
      const base = nudge ? nudge.to : position;
      const index =
        direction > 0
          ? Math.floor(base / size + 0.2) + 1
          : Math.ceil(base / size - 0.2) - 1;
      let from = position;
      let to = index * size;

      // Cả điểm đi lẫn điểm đến phải nằm trong vùng cuộn: lùi ở đầu bản thứ
      // nhất hay tiến ở cuối bản thứ hai thì dời sang bản kia — nội dung trùng
      // khít nên mắt không thấy cú dời.
      const max = element.scrollWidth - element.clientWidth;
      if (to < 0) {
        from += cycle;
        to += cycle;
      } else if (to > max) {
        from -= cycle;
        to -= cycle;
      }

      write(from);
      nudge = { from, to, start: performance.now() };
      holdUntil = nudge.start + NUDGE_DURATION + RESUME_DELAY;
    };

    const onScroll = () => {
      // Giá trị khác lần ghi cuối nghĩa là người xem đang cuộn (chuột, vuốt,
      // phím): buông vòng lặp ngay, kể cả cú nhích đang chạy dở.
      if (Math.abs(element.scrollLeft - written) > 1.5) {
        position = written = element.scrollLeft;
        nudge = null;
        hold();
        paint(position, cycleWidth(), element.clientWidth, true);
      }
    };

    const onEnter = () => {
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
    };
    const onDown = () => {
      pressing = true;
    };
    // Trên cảm ứng `pointercancel` bắn ngay lúc trình duyệt nhận cú vuốt —
    // trước cả sự kiện `scroll` đầu tiên — nên phải giữ dải lại ở đây luôn.
    const onUp = () => {
      pressing = false;
      hold();
    };
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = () => {
      focused = false;
    };
    const onResize = () =>
      paint(position, cycleWidth(), element.clientWidth, true);

    paint(position, cycleWidth(), element.clientWidth, true);

    element.addEventListener("scroll", onScroll, { passive: true });
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    element.addEventListener("focusin", onFocusIn);
    element.addEventListener("focusout", onFocusOut);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      nudgeRef.current = null;
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      element.removeEventListener("focusin", onFocusIn);
      element.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", onResize);
    };
  }, [looping, paint]);

  const step = (direction: 1 | -1) => {
    if (looping) {
      nudgeRef.current?.(direction);
      return;
    }
    // Lật tay đi đúng một khung hình; không có vòng lặp nào tranh `scrollLeft`
    // nên cuộn mượt của trình duyệt (và snap) làm việc này tốt nhất.
    const element = viewport.current;
    element?.scrollBy({
      left: direction * element.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div className="container-page mb-6 flex items-center justify-between gap-4">
        {/* Thanh tiến độ chứ không phải chấm trang: một "trang" ở đây không
            phải một đơn vị cố định — desktop lật ba tấm còn mobile lật một tấm
            (tấm rộng 78% để lộ tấm sau), nên số chấm sẽ không khớp số điểm
            snap thật. Thanh này đọc thẳng `scrollLeft` nên luôn đúng. */}
        <span
          ref={bar}
          aria-hidden
          // 2px chứ không 1px: con trượt rộng chưa tới 20px trên mobile, ở độ
          // dày 1px thì trên nền giấy gần như không nhìn ra.
          className="relative block h-0.5 w-24 overflow-hidden rounded-full bg-foreground/15 sm:w-40"
        >
          {/* `scaleX` chứ không đổi `width`: thanh cập nhật ở mọi khung hình,
              đổi width là bắt trình duyệt tính lại layout mỗi lần. */}
          <span
            ref={fillRef}
            className="absolute inset-0 block origin-left bg-primary will-change-transform"
            style={{ transform: "scaleX(0)" }}
          />
        </span>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => step(-1)}
            disabled={!looping && edges.start}
            aria-label={prevLabel}
            className="size-11 rounded-full"
          >
            <ArrowLeft aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => step(1)}
            disabled={!looping && edges.end}
            aria-label={nextLabel}
            className="size-11 rounded-full"
          >
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>

      <div
        ref={viewport}
        onScroll={looping ? undefined : sync}
        role="region"
        aria-label={label}
        // Vùng cuộn phải nhận được focus thì người dùng bàn phím mới lật được
        // bằng phím mũi tên.
        tabIndex={0}
        className={cn(
          "overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden",
          // `scroll-snap` và vòng lặp tự chạy đánh nhau: snap kéo ngược lại
          // đúng lúc mỗi khung hình vừa nhích `scrollLeft` đi vài px.
          !looping && "snap-x snap-mandatory",
          !bleed && "container-page",
        )}
      >
        {/* Không dùng `gap`: khoảng cách nằm ở chính mỗi tấm (`pr-*`) để hai
            bản sao rộng bằng nhau tuyệt đối — lệch một khoảng gap là chỗ nối
            của dải lặp giật một cái. */}
        <ul
          ref={track}
          // `w-max` chỉ cho dải lặp: ở chế độ lật tay bề rộng tấm khai bằng
          // phần trăm, mà phần trăm trong một flex `w-max` thì quy chiếu vòng
          // về chính nội dung.
          className={cn("flex items-start", looping && "w-max")}
        >
          {items.map((item) => (
            <li
              key={getKey(item)}
              data-rail-item
              className={cn("shrink-0", !looping && "snap-start", itemClassName)}
            >
              {renderItem(item)}
            </li>
          ))}
          {looping
            ? items.map((item) => (
                <li
                  key={`clone-${getKey(item)}`}
                  aria-hidden
                  data-rail-item
                  className={cn("shrink-0", itemClassName)}
                >
                  {renderItem(item)}
                </li>
              ))
            : null}
        </ul>
      </div>
    </div>
  );
}
