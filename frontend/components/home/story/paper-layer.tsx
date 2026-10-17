import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Motif "lớp giấy thiệp": hai mép giấy lệch nhau phía sau nội dung, tạo cảm
 * giác thiệp được đặt chồng lên nhau. Dùng cùng sợi chỉ vàng làm ngôn ngữ hình
 * ảnh xuyên suốt homepage.
 */
export function PaperLayer({
  children,
  className,
  tight = false,
}: {
  children: ReactNode;
  className?: string;
  /** Giảm độ lệch của mép giấy — dùng cho card nhỏ. */
  tight?: boolean;
}) {
  const offset = tight ? ["translate-x-1 translate-y-1", "translate-x-2 translate-y-2"] : ["translate-x-1.5 translate-y-1.5", "translate-x-3 translate-y-3"];

  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 border border-foreground/10 bg-card/40",
          offset[1],
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 border border-foreground/15 bg-card/70",
          offset[0],
        )}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
