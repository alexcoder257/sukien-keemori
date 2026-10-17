"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

/**
 * Khung thiệp (max-width 640) — cùng quy cách với `thumbnail.avif`. Trước đây
 * iframe dựng ở 1440px nên thiệp 640px nằm giữa và hai bên lộ ~800px nền
 * trang trắng.
 *
 * Viewport là 644 chứ không phải 640: nhiều mẫu có `@media (max-width: 640px)`,
 * dựng đúng 640 là ra bố cục mobile. Thiệp nằm ở x = 2, nên iframe bị kéo sang
 * trái 2px và chỉ khung 640 được phóng cho khít khung xem thử.
 */
const FRAME_WIDTH = 640;
const VIEWPORT_WIDTH = FRAME_WIDTH + 4;
const OFFSET = (VIEWPORT_WIDTH - FRAME_WIDTH) / 2;

/**
 * Đo khung chứa và trả về style thu nhỏ một iframe khổ desktop cho vừa khung.
 *
 * Tỉ lệ thu nhỏ cũng chính là thứ quyết định *cảm giác* nhanh chậm của lượt tự
 * cuộn: `usePreviewAutoscroll` cuộn theo px trong toạ độ của iframe, mắt người
 * xem thì thấy px đó đã nhân với `scale`. Vì vậy mọi nơi hiện bản xem thử đều
 * phải dựng theo cùng một cách, nếu không cùng một lượt cuộn sẽ nơi thong thả
 * nơi vun vút.
 */
export function useScaledFrame() {
  // Khung co giãn theo màn hình nên phải đo lại, không chốt cứng được một con
  // số.
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const observerRef = useRef<ResizeObserver | null>(null);
  // Nút DOM của khung, giữ trong state để nơi dùng có thể chạy effect ngay khi
  // khung vào DOM (card cần nó để tìm phần tử cha nghe hover).
  const [box, setBox] = useState<HTMLDivElement | null>(null);

  /**
   * Callback ref chứ không phải `useRef` + `useEffect`: khung có thể vào DOM
   * muộn hơn component (khung trong dialog chỉ tồn tại khi dialog mở), lúc đó
   * effect chạy một lần khi mount sẽ đo hụt và iframe không bao giờ dựng.
   */
  const boxRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    setBox(node);
    if (!node) {
      setSize(null);
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((current) =>
        current?.width === width && current.height === height
          ? current
          : { width, height },
      );
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const scale = size ? size.width / FRAME_WIDTH : 0;

  // Chiều cao chia ngược cho `scale` để sau khi thu vẫn phủ kín khung — nhờ vậy
  // mọi đơn vị `svh` bên trong thiệp đo theo đúng khung người xem đang nhìn.
  // `translateX` đứng trước `scale` nên tính bằng px của khung ngoài.
  const frameStyle: CSSProperties | undefined = size
    ? {
        width: VIEWPORT_WIDTH,
        height: size.height / scale,
        transform: `translateX(${-OFFSET * scale}px) scale(${scale})`,
        transformOrigin: "top left",
      }
    : undefined;

  return { boxRef, box, ready: size !== null, frameStyle };
}
