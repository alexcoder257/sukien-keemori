"use client";

import Image from "next/image";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Hướng dẫn ba bước lấy link chia sẻ trên Google Maps.
 *
 * Mở trong dialog chứ **không** bung tại chỗ: ảnh cao gấp rưỡi bề ngang, nên
 * trải trong panel editor là nó chiếm trọn màn hình và đẩy nút "Lưu" ra khỏi
 * tầm nhìn. Thu nhỏ lại vừa cột thì chữ trong ảnh không đọc nổi — mà ảnh này
 * chỉ có giá trị khi đọc được. Dialog giải quyết cả hai: form không xê dịch,
 * ảnh vẫn xem ở cỡ đủ lớn.
 *
 * Ảnh là **tiếng Việt**. Giao diện Maps chạy theo ngôn ngữ tài khoản Google của
 * người dùng chứ không theo locale trang này, nên ảnh tiếng Việt ở bản `en` vẫn
 * khớp hơn là không có gì; phần chữ vẫn dịch bình thường.
 */
export function MapLinkGuide({
  dict,
}: {
  dict: Dictionary["editor"]["places"];
}) {
  return (
    <Dialog>
      <DialogTrigger
        type="button"
        className="mt-3 flex items-center gap-1.5 text-caption font-medium text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:decoration-primary"
      >
        <HelpCircle className="size-3.5" aria-hidden />
        {dict.guideToggle}
      </DialogTrigger>

      {/* Dưới 440px mở toàn màn hình, cùng bộ class với các dialog toàn màn
          khác của editor (`couple-names-locked-dialog`, `guest-invite-fields`):
          khung nổi giữa màn điện thoại chừa hai viền tối vô ích hai bên, còn
          ảnh hướng dẫn thì cần từng pixel bề ngang để chữ trong ảnh đọc được. */}
      <DialogContent className="max-w-md max-mobile:inset-0 max-mobile:h-dvh max-mobile:max-h-none max-mobile:w-full max-mobile:max-w-none max-mobile:translate-none max-mobile:rounded-none max-mobile:bg-background max-mobile:px-6">
        <DialogHeader>
          <DialogTitle>{dict.guideToggle}</DialogTitle>
          <DialogDescription>{dict.guideCaption}</DialogDescription>
        </DialogHeader>
        {/* Ảnh dọc và dài: cho cuộn trong dialog thay vì ép cả trang cao lên.
            Ở toàn màn hình thì bỏ vùng cuộn riêng — cả dialog đã tự cuộn, hai
            vùng cuộn lồng nhau chỉ làm ngón tay vuốt nhầm tầng. */}
        <div className="max-h-[65vh] overflow-y-auto rounded-xl border border-input max-mobile:max-h-none max-mobile:overflow-visible">
          <Image
            src="/images/site/huong-dan-lay-link-google-maps.avif"
            alt={dict.guideAlt}
            width={900}
            height={1350}
            sizes="(max-width: 440px) 100vw, (max-width: 640px) 90vw, 420px"
            className="h-auto w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
