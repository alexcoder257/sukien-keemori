import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SCALE = [1, 2, 3, 4, 5];

/**
 * Cụm 5 sao chỉ để đọc, dùng trong bảng kiểm duyệt đánh giá.
 *
 * Điểm ở khu quản trị luôn là số nguyên 1–5 (điểm của một người, không phải
 * trung bình), nên ở đây không cần tô sao một phần như bản của trang khách.
 */
export function RatingStars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value}/5`}
    >
      {SCALE.map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn(
            "size-3.5",
            star <= value ? "fill-primary text-primary" : "text-primary/25",
          )}
        />
      ))}
    </span>
  );
}
