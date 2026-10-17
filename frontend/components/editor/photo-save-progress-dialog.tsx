"use client";

import { Heart, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";

export type PhotoSaveStage = "uploading" | "processing" | "finishing" | "done";

export type PhotoSaveProgress = {
  stage: PhotoSaveStage;
  /** 0 → 100, đã gộp mọi bước của lượt lưu. */
  percent: number;
  /** Số ảnh đã nhận về thiệp — chỉ có nghĩa ở bước `processing`. */
  done: number;
  total: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: PhotoSaveProgress;
  dict: Dictionary["editor"]["photoSaveProgress"];
};

/**
 * Lượt lưu thiệp có ảnh phải đợi server nén xong từng tấm — với album đầy có
 * khi mất cả chục giây. Chữ trên nút lưu nhỏ và nằm ở góc, người ta nhìn nó
 * đứng im rồi tưởng treo máy, nên lúc này dựng một hộp thoại nói rõ đang ở
 * bước nào và còn bao nhiêu.
 *
 * Hộp thoại chỉ là chỗ **xem**: đóng nó không huỷ gì cả. Lượt lưu vẫn chạy,
 * nút lưu vẫn khoá và quay như cũ cho tới khi xong.
 */
export function PhotoSaveProgressDialog({
  open,
  onOpenChange,
  progress,
  dict,
}: Props) {
  const percent = Math.round(progress.percent);
  const finished = progress.stage === "done";
  const stageLabel =
    progress.stage === "processing"
      ? fill(dict.stages.processing, {
          done: progress.done,
          total: progress.total,
        })
      : dict.stages[progress.stage];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Điện thoại: toàn màn hình như các hộp khác của editor
        // (`couple-names-locked-dialog.tsx`). Đây là màn chờ nên phần tiến độ
        // đứng giữa màn hình, nút đóng neo đáy.
        className="max-w-md text-center max-mobile:inset-0 max-mobile:h-dvh max-mobile:max-h-none max-mobile:w-full max-mobile:max-w-none max-mobile:translate-none max-mobile:rounded-none max-mobile:bg-background max-mobile:px-6"
      >
        <div className="flex flex-col max-mobile:my-auto">
          <DialogHeader className="items-center pr-0">
            <WaitingIcon finished={finished} />
            <DialogTitle>{finished ? dict.doneTitle : dict.title}</DialogTitle>
            <DialogDescription className="text-body">
              {dict.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4 text-small">
              <span
                aria-live="polite"
                className="text-left text-muted-foreground"
              >
                {stageLabel}
              </span>
              <span className="font-medium tabular-nums text-primary">
                {percent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={dict.title}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <p className="mt-4 text-caption text-muted-foreground">{dict.hint}</p>
        </div>

        <DialogFooter className="justify-center max-mobile:pt-8 max-mobile:[&>*]:flex-1">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            {dict.dismiss}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Vòng quay quanh trái tim đang đập; xong thì đổi sang đôi tay nắm. */
function WaitingIcon({ finished }: { finished: boolean }) {
  if (finished) {
    return (
      <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-primary/12 text-primary animate-in zoom-in-50 fade-in duration-500 motion-reduce:animate-none">
        <HeartHandshake aria-hidden className="size-8" />
      </span>
    );
  }

  return (
    <span className="relative mb-2 flex size-16 items-center justify-center rounded-full bg-primary/12 text-primary">
      <span
        aria-hidden
        className="absolute inset-0 animate-spin rounded-full border-2 border-primary/15 border-t-primary [animation-duration:1.6s] motion-reduce:animate-none"
      />
      <Heart
        aria-hidden
        className="size-7 animate-pulse fill-primary/25 motion-reduce:animate-none"
      />
    </span>
  );
}
