import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Ô ảnh **đã có chỗ nhưng chưa có ảnh**: tấm vừa chọn còn đang thu nhỏ, hoặc
 * tấm của bản nháp còn đang tải lại. Mỗi tấm một ô riêng, đặt đúng vị trí nó sẽ
 * nằm, để người dùng đếm được đủ số ảnh mình đã chọn ngay từ đầu — lưới vơi đi
 * rồi đầy dần trông như mất ảnh, và họ đi chọn lại.
 *
 * Vòng xoay nằm giữa ô skeleton vì vệt sáng của skeleton quá kín đáo ở ô nhỏ:
 * nhìn một mình nó dễ tưởng là ô trống.
 */
export function PhotoTilePending({
  label,
  className,
}: {
  /** Đọc cho trình đọc màn hình; ô không có chữ hiển thị. */
  label: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("relative aspect-square", className)}
    >
      <Skeleton className="absolute inset-0 rounded-xl" />
      <Loader2
        aria-hidden
        className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
      />
    </div>
  );
}
