"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Download, ExternalLink } from "lucide-react";
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
import { fill } from "@/lib/format";
import { downloadQrPng } from "@/lib/qr-png";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Link mời chung; link riêng từng khách nằm ở màn Link khách mời. */
  slug: string;
  dict: Dictionary["myCards"]["share"];
  commonDict: Dictionary["common"];
  /**
   * Nhãn nút đóng hộp. Mặc định "Xong"; ngay sau "Lưu & Tạo link" thì là "Xem
   * tất cả thiệp" — người dùng vừa từ editor sang, chưa hề thấy danh sách nằm
   * phía sau hộp này.
   */
  doneLabel?: string;
  locale: Locale;
};

/**
 * Link thiệp: chép đi gửi, hoặc tải mã QR về in.
 *
 * QR **luôn đen trên trắng** bất kể tông giao diện đang sáng hay tối. Đây không
 * phải một chi tiết trang trí theo được theme: đảo màu là máy quét đọc hụt, mà
 * cái mã này đi vào thiệp giấy và standee ở tiệc cưới.
 */
/**
 * Dưới `md` hộp thoại chiếm trọn màn hình: nội dung ở đây dài (link, QR), nên
 * khung nổi giữa màn điện thoại vừa chừa hai viền tối vô ích vừa bắt cuộn trong
 * một ô hẹp. `overflow-y-auto` của hộp giữ nguyên để cuộn cả trang hộp thoại.
 */
const FULL_SCREEN_ON_MOBILE =
  "max-md:inset-0 max-md:h-dvh max-md:max-h-none max-md:w-full max-md:max-w-none max-md:translate-none max-md:rounded-none max-md:bg-background max-md:px-6";

export function ShareLinkDialog({
  open,
  onOpenChange,
  slug,
  dict,
  commonDict,
  doneLabel,
  locale,
}: Props) {
  const qrRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const path = `/${locale}/t/${slug}`;
  /**
   * URL đầy đủ chỉ dựng được ở trình duyệt. Không đọc từ biến môi trường vì
   * `window.location.origin` là chính cái tên miền người dùng đang đứng — luôn
   * đúng, kể cả trên bản preview hay khi đổi domain.
   *
   * Đọc ngay lúc khởi tạo state chứ không qua effect: hộp này chỉ được dựng sau
   * khi người dùng bấm nút nên không bao giờ đi qua render phía server; nhánh
   * chuỗi rỗng chỉ là dây an toàn, và hai nút bị khoá khi rơi vào nhánh đó.
   */
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );

  const url = `${origin}${path}`;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Trình duyệt từ chối quyền clipboard (hoặc trang không chạy HTTPS). Bôi
      // sẵn cả dòng link để người dùng chỉ còn phải bấm Ctrl+C, thay vì báo một
      // lỗi mà họ không làm gì được.
      inputRef.current?.select();
    }
  };

  /** Tải QR về dưới dạng PNG — xem lý do ở `downloadQrPng`. */
  const onDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (svg) downloadQrPng(svg, `thiep-${slug}.png`);
  };

  /** "Xem thiệp" + "Tải mã QR" của link đang chọn. */
  const linkActions = (
    <>
      <a
        href={path}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "gap-2",
        })}
      >
        <ExternalLink aria-hidden className="size-4" />
        {dict.openCard}
      </a>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={onDownload}
        disabled={!origin}
      >
        <Download aria-hidden className="size-4" />
        {dict.downloadQr}
      </Button>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] max-w-md overflow-y-auto",
          FULL_SCREEN_ON_MOBILE,
        )}
      >
        <DialogHeader>
          <DialogTitle>{dict.title}</DialogTitle>
          <DialogDescription>{dict.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col gap-2">
          <label
            className="text-small text-muted-foreground"
            htmlFor="share-url"
          >
            {dict.linkLabel}
          </label>
          <div className="flex gap-2">
            <input
              id="share-url"
              ref={inputRef}
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 rounded-xl border border-input bg-transparent px-4 py-2 text-small"
            />
            <Button
              size="sm"
              className="shrink-0 gap-2"
              onClick={onCopy}
              disabled={!origin}
            >
              {copied ? (
                <Check aria-hidden className="size-4" />
              ) : (
                <Copy aria-hidden className="size-4" />
              )}
              {copied ? dict.copied : dict.copy}
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          {/* Nền trắng cố định, không dùng token màu: xem ghi chú ở đầu file. */}
          <div ref={qrRef} className="rounded-2xl bg-white p-4">
            {origin ? (
              <QRCode
                value={url}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                title={fill(dict.qrTitle, { slug })}
              />
            ) : (
              <div className="size-[180px]" />
            )}
          </div>
          <p className="max-w-xs text-center text-caption text-muted-foreground">
            {dict.qrHint}
          </p>
        </div>

        {/* `items-center` chứ không để `stretch` mặc định: hàng này xuống dòng
            được, và khi xuống dòng thì hai nút ở dòng trên bị kéo cao bằng
            nhau còn nút cuối đứng lệch.

            Điện thoại: mỗi nút giãn lấp hàng của nó — hai nút phụ chia đôi
            hàng trên, nút chính rơi xuống và chiếm trọn hàng dưới. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 max-md:[&>*]:flex-1">
          {linkActions}
          <Button size="sm" onClick={() => onOpenChange(false)}>
            {doneLabel ?? commonDict.actions.done}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
