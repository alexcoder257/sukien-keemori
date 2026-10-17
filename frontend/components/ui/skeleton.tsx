import { cn } from "@/lib/utils";

/**
 * Khối giữ chỗ khi nội dung chưa về. Màu và vệt sáng nằm ở utility `skeleton`
 * trong `globals.css` — không dùng `animate-pulse bg-accent` mặc định của
 * shadcn: `--accent` ở đây là Champagne, và pulse trên nền tối chỉ ra một mảng
 * xám phẳng.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn("skeleton relative rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
