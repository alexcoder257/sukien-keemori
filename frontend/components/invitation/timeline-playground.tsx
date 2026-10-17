"use client";

import { useState } from "react";
import { Camera, Church, Clock3, Heart, Music2, Wine } from "lucide-react";
import {
  WeddingTimeline,
  TIMELINE_VARIANTS,
  TIMELINE_FONT_COMBOS,
  weddingTimelineData,
} from "@/components/invitation/shared/wedding-timeline";
import type { TimelineFontCombo } from "@/components/invitation/shared/wedding-timeline";
import styles from "@/components/invitation/timeline-playground.module.css";

const icons = [
  <Heart key="heart" />,
  <Church key="church" />,
  <Wine key="wine" />,
  <Camera key="camera" />,
  <Music2 key="music" />,
  <Clock3 key="clock" />,
];
const activities = [
  "Đón khách",
  "Lễ thành hôn",
  "Khai tiệc",
  "Chụp ảnh cùng gia đình",
  "Âm nhạc & lời chúc",
  "Tiễn khách",
];
const times = ["17:00", "17:30", "18:00", "19:00", "19:30", "20:00"];
// Hoạ tiết trung tính của `images/shared/` — kho mẫu đang trống.
const images = ["orchid-cascade", "orchid-hydrangea", "wax-seal"];
const variants = {
  horizontal: "Hàng ngang",
  vertical: "Trục dọc",
  alternating: "So le hai bên",
};

/** Internal reference surface: controls are intentionally independent of the invitation editor. */
export function TimelinePlayground() {
  const [count, setCount] = useState(5);
  const [media, setMedia] = useState("icons");
  const [combo, setCombo] = useState<TimelineFontCombo>("uvn-hoa-tay");
  const [tone, setTone] = useState("olive");
  const [longText, setLongText] = useState(false);
  const [sparse, setSparse] = useState(false);
  const [decorSize, setDecorSize] = useState(72);
  const items = activities.slice(0, count).map((activity, index) => ({
    startTime: sparse && index % 2 === 0 ? "" : times[index],
    endTime: sparse && index % 2 === 1 ? "" : index === 0 ? "17:30" : "",
    activity: longText
      ? `${activity} — cùng lưu giữ những khoảnh khắc đáng nhớ trong ngày vui của hai gia đình`
      : activity,
  }));
  const data = weddingTimelineData(
    items,
    "Timeline",
    media === "icons"
      ? { kind: "icon", resolve: (_item, index) => icons[index] }
      : {
          kind: "image",
          resolve: (_item, index) => ({
            src:
              media === "broken"
                ? "/images/timeline-deliberately-missing.avif"
                : `/images/shared/opening/${images[index % images.length]}.avif`,
            fallbackSrc: "/images/shared/opening/orchid-cascade.avif",
            unoptimized: true,
          }),
        },
  );
  const colors =
    tone === "olive"
      ? {
          ink: "#394530",
          muted: "#505e47",
          accent: "#555f42",
          rule: "#b4bba9",
          surface: "transparent",
        }
      : {
          ink: "#4e3337",
          muted: "#715159",
          accent: "#8a4457",
          rule: "#c8adb4",
          surface: "transparent",
        };
  return (
    <div className={styles.playground}>
      <div className={styles.controls}>
        <label>
          Số mục
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
                {n === 6 ? " (kiểm tra không cắt dữ liệu)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Decor
          <select value={media} onChange={(e) => setMedia(e.target.value)}>
            <option value="icons">Icon</option>
            <option value="images">Ảnh decor</option>
            <option value="broken">Ảnh lỗi → ảnh dự phòng</option>
          </select>
        </label>
        <label>
          Combo font
          <select
            value={combo}
            onChange={(e) => setCombo(e.target.value as TimelineFontCombo)}
          >
            {Object.keys(TIMELINE_FONT_COMBOS).map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
        </label>
        <label>
          Bảng màu
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="olive">Olive</option>
            <option value="rose">Rose</option>
          </select>
        </label>
        <label>
          Cỡ decor
          <select
            value={decorSize}
            onChange={(e) => setDecorSize(Number(e.target.value))}
          >
            {[48, 72, 96].map((n) => (
              <option key={n} value={n}>
                {n}px
              </option>
            ))}
          </select>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={longText}
            onChange={(e) => setLongText(e.target.checked)}
          />
          Nội dung dài
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={sparse}
            onChange={(e) => setSparse(e.target.checked)}
          />
          Giờ bắt đầu/kết thúc trống
        </label>
      </div>
      <div className={styles.gallery}>
        {TIMELINE_VARIANTS.map((variant) => (
          <article key={variant} className={styles.example}>
            <header>
              <h2>{variants[variant]}</h2>
              <code>{variant}</code>
            </header>
            <div className={`theme-invitation ${styles.canvas}`}>
              <WeddingTimeline
                variant={variant}
                data={data}
                colors={colors}
                typography={{ combo }}
                decorSize={decorSize}
              />
              {count === 0 ? (
                <p className={styles.empty}>
                  Không có item: component trả về null.
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <article className={styles.wide}>
        <header>
          <h2>Hàng ngang — khung rộng</h2>
          <p>Tự xuống hàng trên khung hẹp, tối đa 5 cột khi có đủ chỗ.</p>
        </header>
        <div className={`theme-invitation ${styles.canvas}`}>
          <WeddingTimeline
            variant="horizontal"
            data={data}
            colors={colors}
            typography={{ combo }}
            decorSize={decorSize}
          />
        </div>
      </article>
    </div>
  );
}
