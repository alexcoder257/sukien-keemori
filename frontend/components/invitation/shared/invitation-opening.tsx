"use client";

import { useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useEnvelopePhase } from "@/hooks/use-envelope-phase";
import styles from "./invitation-opening.module.css";

export type InvitationOpeningMotion = "fade" | "paper-bloom" | "paper-lift";

export type InvitationOpeningBurst =
  | {
      kind: "petals";
      /** Giữ mật độ vừa phải để hiệu ứng vẫn đọc như cánh hoa, không thành confetti. */
      count?: number;
    }
  | {
      kind: "confetti";
      /** Pháo giấy cần dày hơn cánh hoa nhưng vẫn có trần bảo vệ hiệu năng. */
      count?: number;
    };

/**
 * Quỹ đạo cánh hoa được **tính ra chứ không khai tay**, vì mật độ đủ để đọc là
 * "tung ra" nằm ở khoảng 40–60 hạt — chép tay chừng đó dòng thì không ai sửa
 * nổi nhịp nữa.
 *
 * Nhiễu phải **tất định**: cùng một index luôn cho cùng một quỹ đạo. Dùng
 * `Math.random()` ở đây là server và client dựng ra hai bộ toạ độ khác nhau,
 * và React sẽ báo hydration mismatch trên đúng màn đầu tiên khách nhìn thấy.
 */
function noise(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Ba lớp chiều sâu. Đây là thứ tách "mưa cánh hoa" khỏi "confetti": hạt tiền
 * cảnh to, mờ nhẹ và quét qua khung thật nhanh; hạt hậu cảnh nhỏ, nhạt và trôi
 * chậm. Mắt đọc chênh lệch tốc độ đó ra thành không gian ba chiều.
 */
const PETAL_DEPTHS = [
  {
    name: "near",
    scale: 1.32,
    opacity: 0.95,
    blur: 0.7,
    speed: 0.82,
    share: 0.26,
  },
  { name: "mid", scale: 0.92, opacity: 0.9, blur: 0, speed: 1, share: 0.44 },
  {
    name: "far",
    scale: 0.55,
    opacity: 0.55,
    blur: 0.5,
    speed: 1.28,
    share: 0.3,
  },
] as const;

type PetalPath = {
  x: number;
  y: number;
  fall: number;
  spin: number;
  tilt: number;
  delay: number;
  scale: number;
  opacity: number;
  blur: number;
  duration: number;
};

/**
 * Toả đều theo góc rồi mới nhiễu quanh vị trí đó — rải hoàn toàn ngẫu nhiên sẽ
 * để lại mảng trống và cụm dày, thứ đọc ra ngay là "máy sinh số".
 */
function buildPetalPaths(count: number, durationMs: number): PetalPath[] {
  return Array.from({ length: count }, (_, index) => {
    const depthIndex =
      noise(index * 3.7) < PETAL_DEPTHS[0].share
        ? 0
        : noise(index * 3.7) < PETAL_DEPTHS[0].share + PETAL_DEPTHS[1].share
          ? 1
          : 2;
    const depth = PETAL_DEPTHS[depthIndex];
    const spread = (index + noise(index * 9.1) * 0.85) / count;
    // Hình quạt hướng lên: cánh hoa bung khỏi nút chứ không rơi thẳng từ trần.
    const angle = (-160 + spread * 140) * (Math.PI / 180);
    const reach = 190 + noise(index * 5.3) * 320;

    return {
      x: Math.round(Math.cos(angle) * reach * (0.7 + depth.scale * 0.5)),
      y: Math.round(Math.sin(angle) * reach * (0.55 + depth.scale * 0.4)),
      // Rơi xuống hẳn khỏi khung — cánh hoa có khối lượng, không tan giữa không trung.
      fall: Math.round(320 + noise(index * 7.7) * 460),
      spin: Math.round(320 + noise(index * 2.9) * 520) * (index % 2 ? 1 : -1),
      tilt: Math.round(noise(index * 4.1) * 60 - 30),
      delay: Math.round(noise(index * 6.1) * 320),
      scale: Number(
        (depth.scale * (0.78 + noise(index * 8.3) * 0.44)).toFixed(3),
      ),
      opacity: depth.opacity,
      blur: depth.blur,
      duration: Math.round(
        durationMs * depth.speed * (0.86 + noise(index * 1.7) * 0.3),
      ),
    };
  });
}

type ConfettiPath = {
  x: number;
  y: number;
  drop: number;
  spin: number;
  delay: number;
  scale: number;
  opacity: number;
  duration: number;
};

/**
 * Pháo giấy toả tròn như một vụ nổ nhỏ, nhưng hơi hất lên để cụm nằm sát đáy
 * màn hình vẫn bung được phần lớn quỹ đạo vào vùng nhìn thấy.
 */
function buildConfettiPaths(
  count: number,
  durationMs: number,
): ConfettiPath[] {
  const flightMs = Math.min(durationMs * 0.78, 520);

  return Array.from({ length: count }, (_, index) => {
    const spread = (index + noise(index * 8.9) * 0.72) / count;
    const angle = (spread * 360 - 104) * (Math.PI / 180);
    const reach = 128 + noise(index * 5.7) * 220;

    return {
      x: Math.round(Math.cos(angle) * reach),
      y: Math.round(Math.sin(angle) * reach - 48),
      drop: Math.round(22 + noise(index * 4.3) * 58),
      spin: Math.round(380 + noise(index * 2.1) * 720) *
        (index % 2 ? 1 : -1),
      delay: Math.round(noise(index * 6.7) * 64),
      scale: Number((0.62 + noise(index * 7.9) * 0.78).toFixed(3)),
      opacity: Number((0.72 + noise(index * 3.9) * 0.28).toFixed(3)),
      duration: Math.round(flightMs * (0.82 + noise(index * 1.9) * 0.18)),
    };
  });
}

type OpeningControls = {
  /** Bắt đầu chuyển cảnh. Gắn trực tiếp vào CTA chính của màn bìa. */
  openInvitation: () => void;
  /** Dùng để disable CTA trong lúc chuyển cảnh, tránh kích hoạt hai lần. */
  isOpening: boolean;
};

type Props = {
  /** Tắt ở preview/editor thì nội dung xuất hiện ngay, không dựng màn bìa. */
  enabled: boolean;
  /** Phải bằng thời lượng preset để máy trạng thái gỡ màn bìa đúng nhịp. */
  durationMs: number;
  autoScroll?: boolean;
  /**
   * Preset chỉ quyết định nhịp chuyển cảnh; màu, vật liệu và bố cục vẫn thuộc
   * CSS Module của từng mẫu. Thêm mẫu mới không cần chép lại keyframes.
   */
  motion?: InvitationOpeningMotion;
  burst?: InvitationOpeningBurst;
  coverClassName?: string;
  contentClassName?: string;
  renderCover: (controls: OpeningControls) => ReactNode;
  /**
   * Render **ngoài** lớp nội dung, sau khi màn bìa đã đi.
   *
   * Sinh ra vì nút nhạc: nó `position: fixed`, mà lớp nội dung mang `transform`
   * trong lúc mở, và một tổ tiên có transform thì biến `fixed` thành neo theo
   * chính nó — nút sẽ bám chiều cao cả tấm thiệp thay vì bám khung nhìn. 41 mẫu
   * đang tự xử lý bằng cách đặt nút ngoài rồi tự kiểm `opened`.
   */
  renderOutside?: (state: { opened: boolean }) => ReactNode;
  children: ReactNode;
};

/**
 * Sân khấu mở thiệp dùng chung.
 *
 * Template đánh dấu các vai chuyển động trên markup của riêng mình:
 * `data-opening-surface`, `data-opening-emblem`, `data-opening-copy`,
 * `data-opening-decor` và `data-opening-action`. Chúng là presentation contract,
 * không buộc các mẫu phải có cùng DOM hay cùng art direction.
 */
export function InvitationOpening({
  enabled,
  durationMs,
  autoScroll = true,
  motion = "fade",
  burst,
  coverClassName = "",
  contentClassName = "",
  renderCover,
  renderOutside,
  children,
}: Props) {
  const { phase, opened, openEnvelope } = useEnvelopePhase({
    enabled,
    exitMs: durationMs,
    autoScroll,
  });
  const [origin, setOrigin] = useState({ x: 50, y: 62 });

  /**
   * Burst mặc định bung **từ chỗ ngón tay vừa chạm**, nhưng không thể nằm trong
   * CTA: mẫu nào cũng bọc bìa trong một tấm giấy có `overflow: hidden` để hoạ
   * tiết ăn vào mép, và cái overflow đó nhốt luôn cánh hoa lại trong tấm thiệp.
   *
   * Nên burst sống ở lớp phủ. Nếu mẫu đánh dấu `data-opening-burst-origin`, tâm
   * phát được đo từ decor đó; nếu không thì lùi về chính nút vừa bấm. Đo tại
   * thời điểm bấm vì bố cục co giãn theo `svh`, và trên điện thoại nó đổi mỗi
   * lần thanh địa chỉ ẩn hiện.
   */
  const handleOpen = (event?: MouseEvent<HTMLElement>) => {
    const action = event?.currentTarget;
    const cover = action?.closest<HTMLElement>("[data-opening-phase]");
    if (action && cover) {
      const coverBox = cover.getBoundingClientRect();
      const source =
        cover.querySelector<HTMLElement>("[data-opening-burst-origin]") ??
        action;
      const sourceBox = source.getBoundingClientRect();
      setOrigin({
        x:
          ((sourceBox.left + sourceBox.width / 2 - coverBox.left) /
            coverBox.width) *
          100,
        y:
          ((sourceBox.top + sourceBox.height / 2 - coverBox.top) /
            coverBox.height) *
          100,
      });
    }
    openEnvelope();
  };

  const durationStyle = {
    "--invitation-opening-duration": `${durationMs}ms`,
  } as CSSProperties;
  // Trần 72 là chốt chặn hiệu năng, không phải con số thẩm mỹ: mỗi cánh hoa là
  // một layer hợp thành riêng, và điện thoại tầm trung bắt đầu rớt khung ở trên
  // ngưỡng đó.
  const petalCount = Math.min(Math.max(Math.round(burst?.count ?? 48), 4), 72);
  const petals = buildPetalPaths(petalCount, durationMs);
  const confettiCount = Math.min(
    Math.max(Math.round(burst?.count ?? 56), 8),
    72,
  );
  const confetti = buildConfettiPaths(confettiCount, durationMs);
  /*
   * Lớp neo luôn tồn tại, kể cả khi mẫu không khai `burst`, và được dựng sẵn từ
   * lúc màn bìa còn đóng — mount 50+ node ngay khung hình animation khởi động
   * thì đúng nhịp mở lại là nhịp giật. Chúng đứng im vô hình cho tới khi
   * `data-opening-phase` sang "opening".
   *
   * Gợn sáng phát ra từ **chỗ vừa bấm**, không từ một hoạ tiết cụ thể nào:
   * `[data-opening-emblem]` là vai tuỳ chọn, mẫu nào không có huy hiệu ở giữa
   * bìa vẫn phải nhận được nhịp sáng này. Trước đây nó gắn vào `::after` của
   * emblem, nên chỉ chạy cho đúng một mẫu.
   */
  const openingBurst = (
    <span
      className={styles.burstLayer}
      aria-hidden
      style={{ left: `${origin.x}%`, top: `${origin.y}%` }}
    >
      <span className={styles.pulseRing} />
      {burst?.kind === "petals" ? (
        <span className={styles.petalBurst}>
          {petals.map((petal, index) => (
            <span
              className={styles.petal}
              key={index}
              style={
                {
                  "--opening-petal-x": `${petal.x}px`,
                  "--opening-petal-y": `${petal.y}px`,
                  "--opening-petal-fall": `${petal.fall}px`,
                  "--opening-petal-spin": `${petal.spin}deg`,
                  "--opening-petal-tilt": `${petal.tilt}deg`,
                  "--opening-petal-delay": `${petal.delay}ms`,
                  "--opening-petal-scale": petal.scale,
                  "--opening-petal-opacity": petal.opacity,
                  "--opening-petal-blur": `${petal.blur}px`,
                  "--opening-petal-duration": `${petal.duration}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      ) : null}
      {burst?.kind === "confetti" ? (
        <span className={styles.confettiBurst}>
          {confetti.map((piece, index) => (
            <span
              className={styles.confettiParticle}
              key={index}
              style={
                {
                  "--opening-confetti-x": `${piece.x}px`,
                  "--opening-confetti-y": `${piece.y}px`,
                  "--opening-confetti-drop": `${piece.drop}px`,
                  "--opening-confetti-spin": `${piece.spin}deg`,
                  "--opening-confetti-delay": `${piece.delay}ms`,
                  "--opening-confetti-scale": piece.scale,
                  "--opening-confetti-opacity": piece.opacity,
                  "--opening-confetti-duration": `${piece.duration}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      ) : null}
    </span>
  );

  return (
    <>
      {phase !== "open" ? (
        <div
          className={`${styles.cover} ${coverClassName}`}
          data-opening-motion={motion}
          data-opening-burst={burst?.kind}
          data-opening-phase={phase}
          data-lenis-prevent-horizontal
          inert={phase === "opening" ? true : undefined}
          style={durationStyle}
        >
          {renderCover({
            openInvitation: handleOpen,
            isOpening: phase === "opening",
          })}
          {openingBurst}
        </div>
      ) : null}

      <div
        className={`${styles.content} ${contentClassName}`}
        data-opening-motion={motion}
        data-opening-burst={burst?.kind}
        data-opening-phase={phase}
        aria-hidden={opened ? undefined : true}
        inert={opened ? undefined : true}
        style={durationStyle}
      >
        {children}
      </div>

      {renderOutside?.({ opened })}
    </>
  );
}
