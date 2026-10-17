import type { ReactNode } from "react";
import { RevealText } from "@/components/home/story/reveal-text";
import { StoryReveal } from "@/components/home/story/story-reveal";
import { cn } from "@/lib/utils";

type Props = {
  /** Nhãn nhỏ phía trên tiêu đề. */
  eyebrow?: string;
  /** Tiêu đề section. Xuống dòng bằng `\n` để ngắt dòng có chủ đích. */
  title: string;
  /** Đoạn dẫn — cột phải, canh chân với tiêu đề. */
  body?: ReactNode;
  /** Ghi chú/liên kết phụ — hàng dưới cùng, rộng hết lưới. */
  meta?: ReactNode;
  className?: string;
  titleClassName?: string;
};

/**
 * Khối mở đầu section theo lối editorial, đọc theo hai cột trên cùng một hàng:
 * tiêu đề chiếm cột trái, đoạn dẫn ở cột phải và canh *chân* với tiêu đề
 * (`self-end`) nên hai khối chữ chung một đường đáy dù cao thấp khác nhau.
 * Phần phụ nằm ở hàng cuối, rộng hết lưới để consumer tự bố trí bên trong.
 *
 * Cố ý không chừa khoảng rơi tự do giữa tiêu đề và các khối dưới: nhịp nghỉ của
 * trang do `mb-stack` và `pb-section` lo, không phải do một hàng trống.
 *
 * Bố cục đặt bằng hàng/cột của lưới 12 (`row-start` + `col-start`) chứ không
 * dùng margin âm, nên khi xuống mobile lưới tự xếp lại thành một cột theo đúng
 * thứ tự đọc: tiêu đề → đoạn dẫn → phần phụ.
 */
export function EditorialBlock({
  eyebrow,
  title,
  body,
  meta,
  className,
  titleClassName,
}: Props) {
  return (
    <div className={cn("grid-12 mb-stack", className)}>
      <div className="col-span-full space-y-5 md:col-span-7 md:row-start-1 lg:col-span-7">
        {eyebrow ? (
          <StoryReveal className="flex items-center gap-3 text-eyebrow text-primary">
            <span aria-hidden className="h-px w-8 bg-primary/60" />
            {eyebrow}
          </StoryReveal>
        ) : null}
        <RevealText
          as="h2"
          text={title}
          className={cn(
            "font-editorial text-[clamp(2.35rem,4.8vw,4.25rem)] leading-[1.12] font-medium tracking-[-0.03em]",
            titleClassName,
          )}
        />
      </div>

      {body ? (
        <StoryReveal className="col-span-full mt-6 space-y-4 text-body-lg text-muted-foreground md:col-span-5 md:col-start-8 md:row-start-1 md:mt-0 md:self-end md:pb-2">
          {body}
        </StoryReveal>
      ) : null}

      {meta ? (
        <StoryReveal className="col-span-full mt-8 md:row-start-2 md:mt-10">
          {meta}
        </StoryReveal>
      ) : null}
    </div>
  );
}
