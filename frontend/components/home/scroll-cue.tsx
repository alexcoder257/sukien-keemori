import { cn } from "@/lib/utils";
import styles from "./scroll-cue.module.css";

type Props = {
  label: string;
  /**
   * `mouse` là mặc định cho mọi section thường. `envelope` chỉ dành cho cảnh mở
   * đầu homepage, nơi nắp thư lật theo tiến độ cuộn.
   */
  icon?: "mouse" | "envelope";
  className?: string;
};

/**
 * Gợi ý cuộn dùng chung cho mọi section: đường kẻ có vệt sáng chạy, một icon
 * tối giản và dòng chữ được luồng sáng quét ngang, dẫn mắt xuống phần sau.
 *
 * Toàn bộ khối là trang trí nên `aria-hidden` — nội dung không mang thông tin
 * mới cho người dùng screen reader.
 */
export function ScrollCue({ label, icon = "mouse", className }: Props) {
  return (
    <p
      aria-hidden
      // `text-eyebrow` phải nằm ngoài `cn()`: tailwind-merge xếp nó cùng nhóm
      // `text-*` với `text-primary` và bỏ mất một trong hai.
      className={`text-eyebrow ${cn(styles.cue, "text-primary", className)}`}
    >
      <span className={styles.track} />

      {icon === "envelope" ? <EnvelopeIcon /> : <MouseIcon />}

      {/* Hai lớp là bắt buộc: lớp ngoài giữ `color` để `currentColor` trong
          gradient còn giá trị, lớp trong mới là chữ trong suốt để nền lộ qua. */}
      <span className={styles.label}>
        <span className={styles.labelText}>{label}</span>
      </span>
      <span className={styles.dot} />
    </p>
  );
}

/** Chuột với bánh xe lăn xuống — mô tả đúng thao tác người xem cần làm. */
function MouseIcon() {
  return (
    <svg
      viewBox="0 0 24 32"
      className={styles.icon}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3.5" y="1.5" width="17" height="29" rx="8.5" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" className={styles.wheel} />
    </svg>
  );
}

/**
 * Phong thư tối giản. Nắp (`data-reveal-envelope-flap`) do `heroScrollTimeline`
 * lật theo tiến độ cuộn, nên cái người xem thấy khớp đúng với việc họ đang làm.
 */
function EnvelopeIcon() {
  return (
    <svg
      viewBox="0 0 24 18"
      className={styles.icon}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="0.75" y="0.75" width="22.5" height="16.5" rx="1.25" />
      {/* Nếp gấp nằm sẵn bên dưới, để khi nắp lật lên phong thư không rỗng. */}
      <path d="M2.5 5 12 11.5 21.5 5" opacity="0.4" />
      <g data-reveal-envelope-flap className={styles.flap}>
        <path d="M0.75 2 12 10.5 23.25 2" />
      </g>
    </svg>
  );
}
