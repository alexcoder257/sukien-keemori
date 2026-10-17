import type { ReactNode } from "react";
import { ChapterProgress } from "@/components/home/story/chapter-progress";
import { cn } from "@/lib/utils";

export type ChapterTone = "forest" | "paper" | "ivory";

/**
 * `forest` là bề mặt **tuyệt đối**: chương này tối ở cả chế độ sáng lẫn tối vì
 * nhịp đậm–nhạt giữa các chương chính là bố cục của trang chủ.
 *
 * `paper` và `ivory` thì **đi theo chế độ người dùng chọn** — chúng chỉ gọi
 * token nền chứ không gắn `.theme-paper`. Ghim chúng sáng thì bật chế độ tối
 * xong trang chủ vẫn còn ba mảng trắng chói giữa các chương tối.
 *
 * Ở chế độ tối, `paper` (nền trang, forest-ink thuần) và `ivory` (`--card`,
 * chỉ pha thêm 5% ivory) gần như trùng màu — đúng ý cho một Card nổi lên vài
 * milimét, nhưng hai chương liền kề mà giống hệt nhau thì mạch truyện đứng
 * hình. `ivory` vì vậy tự pha đậm hơn ở tối (11% thay vì 5%) *chỉ cho riêng
 * bối cảnh chương* — không chạm `--card`, nên Card/Popover ở nơi khác không
 * đổi.
 */
const TONE_CLASS: Record<ChapterTone, string> = {
  forest: "theme-forest bg-background glow-surface",
  paper: "bg-background glow-surface",
  ivory:
    "bg-card dark:bg-[color-mix(in_oklab,var(--color-ivory)_11%,var(--color-forest-ink))] glow-surface",
};

type Props = {
  id: string;
  /** Số chương hiển thị, ví dụ "01". */
  index: string;
  /** Nhãn chương lấy từ dictionary. */
  label: string;
  tone: ChapterTone;
  /**
   * Màu nền của chương liền trước, dùng để vẽ dải chuyển tiếp ở mép trên —
   * truyền bằng class nền **đặc** (ví dụ `bg-forest-ink`); độ tan do
   * `chapter-seam` lo. Bỏ qua nếu hai chương cùng tông.
   */
  seamColor?: string;
  /**
   * `flow` (mặc định) đặt nhãn chương theo dòng chảy nội dung; `overlay` phủ
   * nhãn lên trên nội dung — dùng cho hero tràn khung; `sr-only` giữ nhãn cho
   * `aria-labelledby` nhưng ẩn khỏi mắt, dùng khi chính nội dung chương đã vẽ
   * mốc chương ở một chỗ đắc địa hơn (chương mở đầu đặt nó trong cột chữ).
   */
  labelPlacement?: "flow" | "overlay" | "sr-only";
  className?: string;
  children: ReactNode;
};

/**
 * Một chương của câu chuyện homepage: quy định tông nền, dải chuyển tiếp với
 * chương trước và nhãn chương. Server Component — phần chuyển động nằm ở các
 * component con.
 */
export function StoryChapter({
  id,
  index,
  label,
  tone,
  seamColor,
  labelPlacement = "flow",
  className,
  children,
}: Props) {
  const overlay = labelPlacement === "overlay";
  const hiddenLabel = labelPlacement === "sr-only";
  return (
    <section
      id={id}
      aria-labelledby={`${id}-label`}
      // Header ở chế độ overlay đọc thuộc tính này để lấy tông của chương đang
      // nằm dưới nó.
      data-tone={tone}
      className={cn(
        // `overflow-x-clip` chứ không phải `overflow-hidden`: chỉ cần chặn tràn
        // ngang của lớp trang trí, còn `overflow: hidden` sẽ biến section thành
        // vùng cuộn và làm chết `sticky` của nhãn chương.
        "relative isolate overflow-x-clip text-foreground",
        TONE_CLASS[tone],
        className,
      )}
    >
      {seamColor ? (
        <div
          aria-hidden
          className={cn(
            // Cao 18rem chứ không phải 10rem: một dải tan biến chỉ 160px đọc ra
            // như một mép cắt trên section cao hàng nghìn pixel. Nhưng độ cao
            // đó là của cái *đuôi*, không phải của cả chuyển tiếp — đường cong
            // trong `chapter-seam` dồn gần hết màu cũ vào 1/3 đầu, để nhãn
            // chương và tiêu đề bên dưới đứng trên nền của chính chương này.
            "chapter-seam pointer-events-none absolute inset-x-0 top-0 z-10 h-72",
            seamColor,
          )}
        />
      ) : null}

      {/* Nhãn chương dính ở mép trên suốt chiều dài chương, ngay dưới header
          (cao 80px), nên luôn trả lời được "đang ở chương nào". */}
      <p
        id={`${id}-label`}
        className={cn(
          "container-page flex items-center gap-4 text-eyebrow text-primary",
          hiddenLabel
            ? "sr-only"
            : overlay
              ? "absolute inset-x-0 top-0 z-30 pt-24 sm:pt-28"
              : // Chỉ dính từ desktop: trên màn hình hẹp nhãn sẽ đè lên nội
                // dung vì không còn cột lề trống để nó đứng.
                "relative z-30 pt-24 pb-2 sm:pt-28 lg:sticky lg:top-0",
        )}
      >
        <span className="tabular-nums">{index}</span>
        {hiddenLabel ? null : <ChapterProgress />}
        <span>{label}</span>
      </p>

      <div className="relative z-20">{children}</div>
    </section>
  );
}
