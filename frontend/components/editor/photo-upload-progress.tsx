"use client";

import { CloudOff } from "lucide-react";
import { usePhotoUpload } from "@/hooks/use-photo-upload";
import { cn } from "@/lib/utils";

/**
 * Lớp phủ báo tiến độ của một ô ảnh — gồm cả bước thu nhỏ trong trình duyệt
 * (thanh đứng ở 0%) lẫn bước gửi lên vùng tạm.
 *
 * Ảnh bị làm mờ trong lúc chờ chứ không bị thay bằng một ô xám: người dùng vừa
 * chọn đúng tấm đó nên họ cần thấy mình chọn đúng, đồng thời phải thấy nó
 * *chưa xong*. Thanh tiến độ nằm đè lên chính tấm ảnh vì ô ảnh trong lưới rất
 * nhỏ — đặt bên dưới là lưới xô lệch mỗi lần một tấm bắt đầu hoặc kết thúc.
 *
 * Không có trạng thái "xong": gửi xong thì lớp phủ biến mất. Ảnh chỉ thành ảnh
 * thật của thiệp lúc bấm Lưu, và nút Lưu tự báo tiến độ của bước đó.
 */
export function PhotoUploadProgress({
  url,
  failedLabel,
  className,
}: {
  url?: string;
  /** Chữ hiện khi tải hỏng — ảnh vẫn còn, sẽ được gửi lại lúc lưu thiệp. */
  failedLabel: string;
  className?: string;
}) {
  const upload = usePhotoUpload(url);
  if (!upload) return null;

  if (upload.status === "failed") {
    return (
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center gap-1.5 rounded-b-xl bg-forest-ink/80 px-2 py-1.5 text-caption text-ivory backdrop-blur-sm",
          className,
        )}
      >
        <CloudOff aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">{failedLabel}</span>
      </div>
    );
  }

  const percent = Math.round(upload.progress * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "absolute inset-0 flex items-end rounded-xl bg-forest-ink/25 p-2 backdrop-blur-[6px]",
        className,
      )}
    >
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory/30">
        <div
          className="h-full rounded-full bg-champagne transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
