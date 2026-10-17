"use client";

import { useId, useRef } from "react";
import { InvitationGuestGreeting } from "@/components/invitation/shared/invitation-guest-greeting";
import { useInvitationGuest } from "@/components/invitation/shared/invitation-guest-context";
import { GateFoldRibbon, GATE_FOLD_RIBBON_CONTOURS } from "./gate-fold-ribbon";
import styles from "./gate-fold-opening.module.css";

const VIEWBOX = "30 86 925 1432";

/**
 * Ba ảnh chụp cùng một tấm giấy gấp cổng (984×1598), cùng toạ độ, khác trạng
 * thái: còn buộc nơ, giấy trơn đã gỡ nơ, và mặt trong. Đường viền nơ
 * (`GATE_FOLD_RIBBON_CONTOURS`) dò trên chính hình học đó, nên mẫu chỉ được
 * đổi **bảng màu** của bộ ảnh, không được thay bằng một tấm giấy chụp khác.
 * Chép từ `thiep-cuoi-online` (mẫu `do-burgundy`); ở đây `burgundy-birthday`
 * dùng nguyên bộ ảnh gốc.
 */
export type GateFoldArt = {
  wrap: string;
  paper: string;
  innerPaper: string;
};

/**
 * Màn gói giấy gấp cổng thắt nơ: nơ lụa tuột (WebGL, có SVG dự phòng), bốn
 * cánh giấy lật ra, rồi máy quay tiến vào đúng tấm bìa thật nằm dưới giấy.
 *
 * Hợp đồng với mẫu:
 * - gốc mẫu mang `data-gate-opening-root` và `GATE_FOLD_OPENING_STYLE`;
 * - bìa bên trong mang `data-gate-opening-cover`, và CSS Module của mẫu chạy
 *   animation máy quay trên nó bằng `--gate-opening-cover-*`;
 * - màu nền, chữ, bóng của màn gói khai bằng `--gate-opening-*` trên gốc mẫu.
 *
 * Màn này đặt sẵn khối "Trân trọng kính mời: <tên khách>" ở link mời riêng,
 * nên bìa bên trong của mẫu giữ lời chào chung dưới tên cô dâu chú rể — xem
 * ngoại lệ trong `CLAUDE.md` mục link mời riêng.
 */
export function GateFoldOpening({
  art,
  openInvitation,
  isOpening,
  label,
  greeting,
}: {
  art: GateFoldArt;
  openInvitation: () => void;
  isOpening: boolean;
  label: string;
  greeting: string;
}) {
  const id = useId().replaceAll(":", "");
  const guest = useInvitationGuest();
  const texture = `${id}-paper`;
  const paperMask = `${id}-paper-mask`;
  const feather = `${id}-paper-feather`;
  const wrapperRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);

  const open = () => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    const root = wrapper?.closest<HTMLElement>("[data-gate-opening-root]");
    const cover = root?.querySelector<HTMLElement>("[data-gate-opening-cover]");
    if (wrapper && stage && root && cover) {
      const box = stage.getBoundingClientRect();
      const target = cover.getBoundingClientRect();
      const screen = wrapper.getBoundingClientRect();
      const scale = box.width / target.width;
      // The live cover sits behind the paper, at exactly the same scale and
      // origin. Both expand together; no screenshot or duplicated invitation.
      const values = {
        "--gate-opening-cover-x": `${box.left - target.left}px`,
        "--gate-opening-cover-y": `${box.top - target.top}px`,
        "--gate-opening-cover-scale": String(scale),
        "--gate-opening-camera-scale": String(1 / scale),
        "--gate-opening-window-left": `${box.left - screen.left}px`,
        "--gate-opening-window-top": `${box.top - screen.top}px`,
        "--gate-opening-window-right": `${box.right - screen.left}px`,
        "--gate-opening-window-bottom": `${box.bottom - screen.top}px`,
      };
      Object.entries(values).forEach(([key, value]) => root.style.setProperty(key, value));
    }
    openInvitation();
  };

  return (
    <button
      ref={wrapperRef}
      type="button"
      className={styles.wrapper}
      data-untying={isOpening}
      onClick={open}
      disabled={isOpening}
      aria-label={label}
      aria-describedby={`${id}-greeting`}
    >
      <span id={`${id}-greeting`} className={styles.greeting}>
        {guest ? (
          <InvitationGuestGreeting as="span" className={styles.guestGreeting} />
        ) : (
          <span className={styles.greetingLabel}>{greeting}</span>
        )}
      </span>
      <span ref={stageRef} className={styles.stage} aria-hidden>
        <svg className={styles.definitions} aria-hidden>
          <defs>
            <filter id={feather} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <mask id={paperMask} maskUnits="userSpaceOnUse" x="0" y="0" width="984" height="1598">
              <rect width="984" height="1598" fill="white" />
              <g fill="black" stroke="black" strokeWidth="180" strokeLinejoin="round" filter={`url(#${feather})`}>
                {GATE_FOLD_RIBBON_CONTOURS.map((path) => <path key={path} d={path} />)}
              </g>
            </mask>
            {/* Keep the photographed paper in its original coordinates. Only
                the ribbon and its shadow reveal the matching clean plate. */}
            <g id={texture}>
              <image href={art.paper} width="984" height="1598" />
              <image href={art.wrap} width="984" height="1598" mask={`url(#${paperMask})`} />
            </g>
            <clipPath id={`${id}-inner-left`}><path d="M35 90H492V1516H30Z" /></clipPath>
            <clipPath id={`${id}-inner-right`}><path d="M491 89L950 87L957 1517H491Z" /></clipPath>
            <clipPath id={`${id}-outer-left`}><path d="M35 90L483 701V896L80 1490L30 1516Z" /></clipPath>
            <clipPath id={`${id}-outer-right`}><path d="M950 87L908 116L498 701V900L910 1490L957 1517Z" /></clipPath>
            <mask id={`${id}-exposed-paper`} maskUnits="userSpaceOnUse" x="0" y="0" width="984" height="1598">
              <rect width="984" height="1598" fill="white" />
              <path d="M35 90L483 701V896L80 1490L30 1516Z M950 87L908 116L498 701V900L910 1490L957 1517Z" fill="black" />
            </mask>
          </defs>
        </svg>

        <svg className={`${styles.gate} ${styles.innerLeft}`} data-paper-layer="inner-left" viewBox={VIEWBOX}>
          <g clipPath={`url(#${id}-inner-left)`}>
            <image href={art.innerPaper} width="984" height="1598" />
            <use className={styles.closedLighting} href={`#${texture}`} mask={`url(#${id}-exposed-paper)`} />
          </g>
        </svg>
        <svg className={`${styles.gate} ${styles.innerRight}`} data-paper-layer="inner-right" viewBox={VIEWBOX}>
          <g clipPath={`url(#${id}-inner-right)`}>
            <image href={art.innerPaper} width="984" height="1598" />
            <use className={styles.closedLighting} href={`#${texture}`} mask={`url(#${id}-exposed-paper)`} />
          </g>
        </svg>
        <svg className={`${styles.gate} ${styles.outerLeft}`} data-paper-layer="outer-left" viewBox={VIEWBOX}>
          <use href={`#${texture}`} clipPath={`url(#${id}-outer-left)`} />
        </svg>
        <svg className={`${styles.gate} ${styles.outerRight}`} data-paper-layer="outer-right" viewBox={VIEWBOX}>
          <use href={`#${texture}`} clipPath={`url(#${id}-outer-right)`} />
        </svg>

        <svg className={styles.still} viewBox={VIEWBOX}>
          <image href={art.wrap} width="984" height="1598" />
        </svg>

        <GateFoldRibbon art={art.wrap} id={id} isOpening={isOpening} />
      </span>
      <span className={styles.hint}>{label}</span>
    </button>
  );
}
