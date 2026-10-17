"use client";

import { Lock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: Dictionary["editor"]["coupleNamesLocked"];
  locale: Locale;
};

/**
 * Lưu bị từ chối vì tên cô dâu chú rể đã khoá (15 ngày sau lần xuất bản đầu).
 *
 * Hộp thoại chứ không phải toast: đây là một **quyết định chặn** người dùng
 * phải hiểu lý do và biết đường gỡ, không phải thông báo thoáng qua — toast
 * dài năm dòng tự biến mất đúng lúc người ta đang đọc tới câu "liên hệ admin".
 *
 * Nút liên hệ mở tab mới: editor không cất nháp khi rời trang, đi cùng tab là
 * mất toàn bộ phần vừa sửa ngoài tên.
 */
export function CoupleNamesLockedDialog({
  open,
  onOpenChange,
  dict,
  locale,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Điện thoại: toàn màn hình, nút neo đáy — cùng cách với hộp bật link
        // mời riêng trong `guest-invite-fields.tsx`.
        className="max-w-md max-mobile:inset-0 max-mobile:h-dvh max-mobile:max-h-none max-mobile:w-full max-mobile:max-w-none max-mobile:translate-none max-mobile:rounded-none max-mobile:bg-background max-mobile:px-6"
      >
        <DialogHeader>
          <span className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-destructive/12 text-destructive">
            <Lock aria-hidden className="size-5" />
          </span>
          <DialogTitle>{dict.title}</DialogTitle>
          <DialogDescription>{dict.description}</DialogDescription>
        </DialogHeader>

        <div className="mt-8 flex flex-wrap justify-end gap-3 max-mobile:mt-auto max-mobile:pt-8 max-mobile:[&>*]:flex-1">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {dict.dismiss}
          </Button>
          <a
            href={`/${locale}/lien-he`}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ size: "sm" })}
          >
            {dict.contact}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
