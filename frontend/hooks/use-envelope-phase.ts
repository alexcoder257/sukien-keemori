"use client";

import { useEffect, useState } from "react";
import { useSmoothScroll } from "@/contexts/smooth-scroll-provider";
import { useAutoScroll } from "@/hooks/use-auto-scroll";

export type EnvelopePhase = "closed" | "opening" | "open";

type Options = {
  /**
   * Thiệp có bật block phong bì không. Tắt thì thiệp mở sẵn — bản xem thử trong
   * card kho mẫu và preview của trình chỉnh sửa đều chạy ở trạng thái này.
   */
  enabled: boolean;
  /**
   * Thời lượng màn phong bì rời đi, tính bằng ms. Phải khớp animation trong CSS
   * Module của mẫu; lệch thì hoặc thiệp hiện ra khi phong bì chưa đi hết, hoặc
   * có một khoảng đứng hình sau khi phong bì đã biến mất.
   */
  exitMs: number;
  /** Thời gian crossfade tối thiểu khi hệ điều hành yêu cầu giảm chuyển động. */
  reducedExitMs?: number;
  /** Keep manual reading for invitations without an automatic scroll experience. */
  autoScroll?: boolean;
};

/**
 * Máy trạng thái của màn mở phong bì, dùng chung cho mọi mẫu thiệp.
 *
 * Ba pha chứ không phải hai: `opening` là khoảng thiệp đã dựng xong phía sau
 * nhưng phong bì còn đang rời đi. Bỏ pha này thì phong bì biến mất tức thì và
 * cú "mở thiệp" chỉ còn là một lần đổi màn hình — mất đúng khoảnh khắc mà cả
 * mẫu được thiết kế để dẫn tới.
 *
 * Trước đây bốn mẫu tự chép lại khối này; nó giống nhau từng dòng ở cả bốn nên
 * mọi sửa lỗi phải làm bốn lần. Mẫu chỉ còn khai `exitMs` của riêng mình.
 */
export function useEnvelopePhase({
  enabled,
  exitMs,
  reducedExitMs = 160,
  autoScroll = true,
}: Options) {
  // Cuộn qua context vì Lenis đang cầm vòng nội suy của trang; `window.scrollTo`
  // sẽ đánh nhau với nó.
  const { scrollTo } = useSmoothScroll();
  const [phase, setPhase] = useState<EnvelopePhase>(
    enabled ? "closed" : "open",
  );
  /**
   * Chỉ tự cuộn khi khách **tự tay** mở phong bì. Bản xem thử tắt block phong bì
   * và được trang cha cuộn hộ — bật theo `phase` thì hai vòng chạy sẽ giành nhau
   * cùng một trang.
   */
  const [autoPlay, setAutoPlay] = useState(false);
  useAutoScroll(autoScroll && autoPlay && phase === "open");

  useEffect(() => {
    if (phase !== "opening") return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? Math.min(exitMs, reducedExitMs)
      : exitMs;
    const timer = setTimeout(() => setPhase("open"), duration);
    return () => clearTimeout(timer);
  }, [phase, exitMs, reducedExitMs]);

  /**
   * Màn phong bì phủ lên khung thiệp nhưng trang phía sau vẫn cuộn được — khách
   * vuốt trong lúc phong bì còn đóng thì lúc mở ra thiệp đã nằm giữa chừng và
   * mất luôn cảnh mở đầu. Kéo về đỉnh ngay khi bấm mở.
   */
  const openEnvelope = () => {
    scrollTo(0);
    setPhase("opening");
    setAutoPlay(true);
  };

  return { phase, opened: phase !== "closed", openEnvelope };
}
