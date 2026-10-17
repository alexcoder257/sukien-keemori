"use client";

import { CircleCheck, Infinity as InfinityIcon, Link2 } from "lucide-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: Dictionary["payment"]["success"];
  /** Nút chính — dẫn tới link và mã QR của thiệp. */
  onDone: () => void;
  donePending?: boolean;
};

/**
 * Màn ăn mừng sau khi tiền đã về.
 *
 * Đây **không** phải một toast: trả tiền là hành động đắt nhất trong cả luồng,
 * nên kết quả của nó phải chiếm giữa màn hình, nói rõ vừa đổi được cái gì và
 * mời người dùng đi tiếp tới việc duy nhất còn lại — chia sẻ link. Một dòng
 * chữ tự tắt sau 4 giây thì vừa dễ trôi qua, vừa khiến một giao dịch thành
 * công trông ngang hàng với "đã chép vào clipboard".
 */
export function PaymentSuccessDialog({
  open,
  onOpenChange,
  dict,
  onDone,
  donePending = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader className="items-center pr-0">
          <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CircleCheck aria-hidden className="size-9" />
          </span>
          <DialogTitle>{dict.title}</DialogTitle>
          <DialogDescription className="text-body">
            {dict.body}
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-6 flex flex-col gap-3 rounded-2xl bg-muted/40 p-4 text-left">
          <Perk
            icon={<InfinityIcon aria-hidden className="size-4" />}
            text={dict.perks.link}
          />
          <Perk
            icon={<Link2 aria-hidden className="size-4" />}
            text={dict.perks.share}
          />
        </ul>

        <DialogFooter className="justify-center">
          <Button size="sm" disabled={donePending} onClick={onDone}>
            {dict.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Một quyền lợi vừa mở khoá. */
function Perk({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3 text-small">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <span>{text}</span>
    </li>
  );
}
