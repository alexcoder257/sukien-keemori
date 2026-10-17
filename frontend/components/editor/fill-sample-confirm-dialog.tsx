"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  dict: Dictionary["editor"]["fillSampleConfirm"];
};

/**
 * Hỏi lại trước khi điền dữ liệu mẫu.
 *
 * Hai lý do phải hỏi: nội dung mẫu là tên, ngày giờ, địa chỉ **giả định** — gửi
 * nguyên thiệp đó cho họ hàng là gửi sai giờ tiệc; và bấm xác nhận là **ghi đè**
 * mọi ô chữ đang có, nên người đã gõ dở không được mất bài vì một cú bấm nhầm.
 */
export function FillSampleConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  dict,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Điện thoại: toàn màn hình, nút neo đáy — cùng cách với
        // `couple-names-locked-dialog.tsx`.
        className="max-w-md max-mobile:inset-0 max-mobile:h-dvh max-mobile:max-h-none max-mobile:w-full max-mobile:max-w-none max-mobile:translate-none max-mobile:rounded-none max-mobile:bg-background max-mobile:px-6"
      >
        <DialogHeader>
          <span className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Wand2 aria-hidden className="size-5" />
          </span>
          <DialogTitle>{dict.title}</DialogTitle>
          <DialogDescription>{dict.description}</DialogDescription>
        </DialogHeader>

        <div className="mt-8 flex flex-wrap justify-end gap-3 max-mobile:mt-auto max-mobile:pt-8 max-mobile:[&>*]:flex-1">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {dict.cancel}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {dict.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
