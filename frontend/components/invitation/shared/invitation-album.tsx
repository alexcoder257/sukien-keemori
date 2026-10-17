"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AlbumPhoto } from "@/components/shared/album-photo";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import styles from "./invitation-album.module.css";

export type WeddingAlbumLayout = "filmstrip" | "mosaic" | "swiper" | "coverflow";

type Props = {
  photos: string[];
  dict: Dictionary["invitation"]["sections"]["album"];
  /**
   * Chỉ quyết định cách dàn ảnh; tiêu đề, câu dẫn và câu chuyện thuộc template.
   * Bỏ trống để giữ grid cũ của các mẫu hiện tại.
   */
  layout?: WeddingAlbumLayout;
  /** Rendered width of the main filmstrip photograph. */
  photoSizes?: string;
  /** Carry a template’s font/theme into the portaled photo viewer. */
  dialogClassName?: string;
};

/**
 * Tỉ lệ tạm dùng trước khi ảnh tải xong. Ảnh cưới phần lớn là ngang, nên đoán
 * 3/2 thì lúc biết tỉ lệ thật lưới xê dịch ít nhất.
 */
const FALLBACK_RATIO = 3 / 2;

/**
 * Nhịp tự chuyển ảnh. Đủ chậm để nhìn hết một tấm ảnh cưới, đủ nhanh để khách
 * biết là băng ảnh còn chạy tiếp mà không phải chờ.
 */
const AUTOPLAY_MS = 4200;

/** Vuốt ngắn hơn mức này là chạm hụt, không phải lệnh chuyển ảnh. */
const SWIPE_THRESHOLD = 40;

/**
 * Nút điều hướng của băng ảnh chỉ là **mũi tên trần**, không đĩa nền — đĩa nền
 * là ngôn ngữ của trình xem ảnh, đặt lên tấm ảnh cưới thì thành một nút bấm
 * dán đè lên tác phẩm. Đổi lại phải có `drop-shadow`: mũi tên không nền rơi
 * vào một vùng ảnh sáng là biến mất, mà ảnh thì do cặp đôi tự tải lên nên
 * không đoán trước được vùng đó sáng hay tối.
 *
 * Vùng chạm vẫn 44px theo chuẩn cảm ứng dù mũi tên nhỏ, và màu đi bằng token
 * `--foreground` để mỗi mẫu chỉnh bằng bảng màu của mình.
 */
const filmstripNavClass =
  "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center text-foreground drop-shadow-[0_1px_2px_rgba(255,255,255,0.55)] transition outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90";

/** Nút điều hướng nổi trên nền ảnh nên phải tự sáng, không mượn token bề mặt. */
const controlClass =
  "flex size-11 items-center justify-center rounded-full bg-forest-ink/55 text-paper backdrop-blur-sm transition-colors outline-none hover:bg-forest-ink/75 focus-visible:ring-2 focus-visible:ring-paper/70";

/**
 * Album dạng grid, bấm để mở trình xem ảnh. Ảnh còn là ô giữ chỗ cho tới khi
 * có luồng upload thật; số ảnh tối đa do backend kiểm tra theo gói.
 *
 * Chỉ vẽ phần ruột — tiêu đề và khung section do template bọc ngoài quyết định.
 */
export function InvitationAlbum({
  photos,
  dict,
  dialogClassName,
  layout,
  photoSizes = "(max-width: 420px) 100vw, 420px",
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  /** Khoá theo URL ảnh chứ không theo vị trí: xoá/đổi thứ tự ảnh không làm sai. */
  const [ratios, setRatios] = useState<Record<string, number>>({});
  /** Người xem đang chạm/rê vào băng ảnh thì dừng tự chuyển. */
  const [paused, setPaused] = useState(false);
  const railRef = useRef<HTMLUListElement>(null);
  const swiperRef = useRef<HTMLUListElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swiped = useRef(false);
  const total = photos.length;
  const filmstrip = layout === "filmstrip";
  /** `coverflow` là `swiper` cùng hành vi, chỉ khác cách dàn: xem CSS. */
  const swiper = layout === "swiper" || layout === "coverflow";
  const selected = total > 0 ? Math.min(selectedIndex, total - 1) : 0;

  const stepSelected = useCallback(
    (delta: number) =>
      setSelectedIndex((current) => (current + delta + total) % total),
    [total],
  );

  const selectSwiper = useCallback(
    (position: number, behavior: ScrollBehavior = "smooth") => {
      const rail = swiperRef.current;
      const item = rail?.children[position] as HTMLElement | undefined;
      if (!rail || !item) return;
      const resolvedBehavior = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? "auto"
        : behavior;
      rail.scrollTo({
        left: item.offsetLeft - (rail.clientWidth - item.clientWidth) / 2,
        behavior: resolvedBehavior,
      });
      setSelectedIndex(position);
    },
    [],
  );

  const syncSwiperIndex = useCallback(() => {
    const rail = swiperRef.current;
    if (!rail) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(rail.children).forEach((child, position) => {
      const item = child as HTMLElement;
      const nextDistance = Math.abs(
        item.offsetLeft + item.clientWidth / 2 - center,
      );
      if (nextDistance < distance) {
        nearest = position;
        distance = nextDistance;
      }
    });
    setSelectedIndex(nearest);
  }, []);

  /**
   * Tự chuyển ảnh bằng `setTimeout` đặt lại sau mỗi lần đổi ảnh, không phải
   * `setInterval`: khách vừa bấm sang tấm kế thì phải được trọn nhịp để nhìn,
   * chứ không bị nhịp cũ đẩy đi tiếp sau nửa giây.
   */
  useEffect(() => {
    if (!filmstrip || total < 2 || paused || openIndex !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setTimeout(
      () => setSelectedIndex((current) => (current + 1) % total),
      AUTOPLAY_MS,
    );
    return () => window.clearTimeout(id);
  }, [filmstrip, total, paused, openIndex, selectedIndex]);

  /**
   * Dải ảnh nhỏ chạy theo ảnh lớn. Tự cuộn bằng `scrollTo` chứ không
   * `scrollIntoView`: hàm kia còn cuộn cả trang theo trục dọc, tức mỗi nhịp tự
   * chuyển ảnh sẽ giật trang thiệp một cái.
   */
  useEffect(() => {
    if (!filmstrip) return;
    const rail = railRef.current;
    const item = rail?.children[selected] as HTMLElement | undefined;
    if (!rail || !item) return;

    rail.scrollTo({
      left: item.offsetLeft - (rail.clientWidth - item.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [filmstrip, selected]);

  const rememberRatio = useCallback((photo: string, value: number) => {
    setRatios((current) =>
      current[photo] === value ? current : { ...current, [photo]: value },
    );
  }, []);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? current : (current + delta + total) % total,
      ),
    [total],
  );

  if (total === 0) return null;

  const index = openIndex ?? 0;

  return (
    <>
      {/* Lưới "justified" kiểu album ảnh: mọi ảnh trong cùng một hàng cao bằng
          nhau, bề rộng tỉ lệ với khung hình gốc, hàng lấp đầy từ mép này sang
          mép kia — không cắt ảnh mà vẫn đều.

          Cách hoạt động: `flex-basis` và `flex-grow` của mỗi ô đều bằng tỉ lệ
          rộng/cao, nên bề rộng các ô trong một hàng tỉ lệ thuận với tỉ lệ ảnh;
          ô lại có `aspect-ratio` đúng bằng tỉ lệ đó, nên chiều cao (rộng chia
          tỉ lệ) ra bằng nhau. `--row-h` là chiều cao hàng mong muốn, flexbox
          co giãn quanh mốc này. */}
      {layout === "filmstrip" ? (
        <div
          data-album-filmstrip
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div
            className="relative"
            onTouchStart={(event) => {
              swipeStartX.current = event.touches[0].clientX;
              swiped.current = false;
              setPaused(true);
            }}
            onTouchMove={(event) => {
              const start = swipeStartX.current;
              if (start === null) return;
              if (Math.abs(event.touches[0].clientX - start) > 10) {
                swiped.current = true;
              }
            }}
            onTouchEnd={(event) => {
              const start = swipeStartX.current;
              swipeStartX.current = null;
              setPaused(false);
              if (start === null || total < 2) return;
              const distance = event.changedTouches[0].clientX - start;
              if (Math.abs(distance) > SWIPE_THRESHOLD) {
                stepSelected(distance < 0 ? 1 : -1);
              }
            }}
          >
            <button
              type="button"
              className="block w-full"
              // Vuốt để chuyển ảnh và chạm để phóng to dùng chung một vùng, nên
              // cú vuốt phải nuốt luôn cú `click` mà trình duyệt phát sau đó —
              // không thì mỗi lần vuốt là một lần bật trình xem ảnh.
              onClick={() => {
                if (swiped.current) {
                  swiped.current = false;
                  return;
                }
                setOpenIndex(selected);
              }}
              aria-label={fill(dict.openPhoto, { index: selected + 1 })}
            >
              <AlbumPhoto
                src={photos[selected]}
                label={fill(dict.openPhoto, { index: selected + 1 })}
                natural
                ratio={2 / 3}
                className="[&_img]:object-contain"
                sizes={photoSizes}
              />
            </button>
            {total > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={dict.prevPhoto}
                  data-album-nav="prev"
                  className={`left-1 ${filmstripNavClass}`}
                  onClick={() => stepSelected(-1)}
                >
                  <ChevronLeft
                    className="size-7"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  aria-label={dict.nextPhoto}
                  data-album-nav="next"
                  className={`right-1 ${filmstripNavClass}`}
                  onClick={() => stepSelected(1)}
                >
                  <ChevronRight
                    className="size-7"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </button>
              </>
            ) : null}
          </div>
          {/* Năm ô vừa khít bề ngang, thanh cuộn ẩn đi: dải này tự chạy theo ảnh
              lớn nên nó là chỉ báo vị trí, không phải thứ khách phải kéo. */}
          <ul
            ref={railRef}
            className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((photo, position) => (
              <li key={photo} className="shrink-0 basis-[calc((100%-2rem)/5)]">
                <button
                  type="button"
                  className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setSelectedIndex(position)}
                  aria-pressed={selected === position}
                  aria-label={fill(dict.openPhoto, { index: position + 1 })}
                >
                  <AlbumPhoto src={photo} ratio={1} sizes="84px" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : layout === "mosaic" ? (
        <ul className={styles.mosaicGrid} data-album-layout="mosaic">
          {photos.map((photo, position) => {
            const photoRatio = ratios[photo] ?? FALLBACK_RATIO;
            return (
              <li
                key={photo}
                className={styles.mosaicItem}
                style={{ "--album-ratio": photoRatio } as CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(position)}
                  aria-label={fill(dict.openPhoto, { index: position + 1 })}
                  className={styles.mosaicButton}
                >
                  <AlbumPhoto
                    src={photo}
                    natural
                    ratio={photoRatio}
                    onRatio={(value) => rememberRatio(photo, value)}
                    className={styles.mosaicPhoto}
                    sizes="(max-width: 420px) 92vw, 560px"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : swiper ? (
        <div
          className={`${styles.swiper} ${layout === "coverflow" ? styles.coverflow : ""}`}
          data-album-layout={layout}
        >
          <ul
            ref={swiperRef}
            className={styles.swiperRail}
            aria-label={dict.title}
            onScroll={syncSwiperIndex}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                return;
              }
              event.preventDefault();
              const next = Math.max(
                0,
                Math.min(
                  total - 1,
                  selected + (event.key === "ArrowLeft" ? -1 : 1),
                ),
              );
              selectSwiper(next);
            }}
            tabIndex={0}
          >
            {photos.map((photo, position) => (
              <li
                key={photo}
                className={styles.swiperSlide}
                data-selected={position === selected}
              >
                <button
                  type="button"
                  className={styles.swiperPhotoButton}
                  onClick={() => setOpenIndex(position)}
                  aria-label={fill(dict.openPhoto, { index: position + 1 })}
                >
                  <AlbumPhoto
                    src={photo}
                    label={fill(dict.openPhoto, { index: position + 1 })}
                    ratio={4 / 5}
                    natural
                    className={styles.swiperPhoto}
                    sizes="(max-width: 640px) 82vw, 500px"
                  />
                </button>
              </li>
            ))}
          </ul>
          {total > 1 ? (
            <>
              <button
                type="button"
                className={`${styles.swiperNav} ${styles.swiperPrev}`}
                aria-label={dict.prevPhoto}
                disabled={selected === 0}
                onClick={() => selectSwiper(selected - 1)}
              >
                <ChevronLeft aria-hidden />
              </button>
              <button
                type="button"
                className={`${styles.swiperNav} ${styles.swiperNext}`}
                aria-label={dict.nextPhoto}
                disabled={selected === total - 1}
                onClick={() => selectSwiper(selected + 1)}
              >
                <ChevronRight aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-wrap gap-3 [--row-h:150px] sm:[--row-h:230px]">
          {photos.map((photo, position) => {
            const photoRatio = ratios[photo] ?? FALLBACK_RATIO;
            return (
              <li
                key={photo}
                className="min-w-0"
                style={{
                  flexGrow: photoRatio,
                  flexBasis: `calc(var(--row-h) * ${photoRatio})`,
                  // Hàng cuối thường thiếu ảnh; không chặn thì một tấm lẻ sẽ bị
                  // kéo rộng hết hàng và phá nhịp của cả album.
                  maxWidth: `calc(var(--row-h) * ${photoRatio * 1.7})`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(position)}
                  aria-label={fill(dict.openPhoto, { index: position + 1 })}
                  className="block w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <AlbumPhoto
                    src={photo}
                    natural
                    ratio={photoRatio}
                    onRatio={(value) => rememberRatio(photo, value)}
                    className="transition-colors hover:border-primary/60"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={openIndex !== null}
        onOpenChange={(open) => {
          if (!open) setOpenIndex(null);
        }}
      >
        {/* Trình xem ảnh, không phải thẻ nội dung: bỏ nền, viền và padding của
            dialog mặc định để chỉ còn tấm ảnh trên nền tối. */}
        <DialogContent
          showCloseButton={false}
          onKeyDownCapture={(event) => {
            // Handle arrows inside the dialog before its focus management.
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              step(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}
          backdropClassName="bg-forest-ink/85"
          // `backdrop-blur-none` là bắt buộc từ khi `DialogContent` dựng trên
          // `surface-glass-strong`: ở đây khung hộp thoại phải **biến mất hẳn**
          // để chỉ còn tấm ảnh, mà `bg-transparent` mới chỉ bỏ màu nền — lớp
          // `backdrop-filter` vẫn làm mờ ảnh nằm sau nó.
          // Bề rộng phải xác định: `w-auto` ở left:50% bị shrink-to-fit còn
          // nửa viewport, còn ảnh con w-full không tạo được intrinsic width.
          className={`w-[92vw] max-w-[1100px] items-center gap-4 overflow-visible bg-transparent p-0 shadow-none backdrop-blur-none ${dialogClassName ?? ""}`}
        >
          <DialogTitle className="sr-only">
            {fill(dict.openPhoto, { index: index + 1 })}
          </DialogTitle>

          <AlbumPhoto
            src={photos[index] ?? ""}
            label={fill(dict.openPhoto, { index: index + 1 })}
            natural
            sizes="(max-width: 1195px) 92vw, 1100px"
            // Chừa chỗ cho nút đóng, điều hướng và mép màn hình khi xoay ngang.
            className="max-h-[min(80svh,calc(100svh-14rem))] w-full shrink-0 border-0 bg-transparent"
          />

          <div className="flex items-center gap-4">
            {total > 1 ? (
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={dict.prevPhoto}
                className={controlClass}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
            ) : null}

            <p className="text-small tabular-nums text-paper/80">
              {fill(dict.counter, { index: index + 1, total })}
            </p>

            {total > 1 ? (
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={dict.nextPhoto}
                className={controlClass}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            ) : null}
          </div>

          <DialogClose
            aria-label={dict.closePhoto}
            className={`absolute -top-3 right-0 -translate-y-full ${controlClass}`}
          >
            <X className="size-5" aria-hidden />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
