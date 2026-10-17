import { cn } from "@/lib/utils";

/**
 * Ô giữ chỗ cho ảnh/preview chưa có nội dung thật (mẫu thiệp, album, thumbnail).
 * Dùng token nền/viền của design system, không thêm màu mới.
 */
export function MediaPlaceholder({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden={!label}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-foreground/20 bg-secondary/60 p-4 text-center text-caption text-muted-foreground",
        className,
      )}
    >
      {children ?? (label ? <span>{label}</span> : null)}
    </div>
  );
}
