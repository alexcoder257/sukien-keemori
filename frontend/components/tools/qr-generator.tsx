"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/i18n/dictionaries";
import { downloadQrPng } from "@/lib/qr-png";

type Dict = Dictionary["tools"]["items"]["qr"]["widget"];

type Props = { dict: Dict };

function validUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Dán link thiệp → mã QR tải về dạng PNG để in lên thiệp giấy.
 *
 * Mã vẽ ngay trong trình duyệt (`react-qr-code`), link không đi qua máy chủ
 * nào — điều trang công cụ có nói thành chữ, nên đừng đổi sang API vẽ QR bên
 * ngoài. Màu đen trên trắng cố định: QR màu nhạt hoặc đảo màu nhiều máy quét
 * không đọc được.
 */
export function QrGenerator({ dict }: Props) {
  const [input, setInput] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);
  const url = validUrl(input);
  const showError = input.trim().length > 0 && !url;

  const onDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (svg) downloadQrPng(svg, "ma-qr-thiep-cuoi.png");
  };

  return (
    <div className="grid gap-8 rounded-2xl border border-border p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
      <div className="space-y-2">
        <Label htmlFor="tool-qr-url">{dict.urlLabel}</Label>
        <Input
          id="tool-qr-url"
          type="url"
          inputMode="url"
          placeholder={dict.urlPlaceholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={showError}
          aria-describedby="tool-qr-url-hint"
        />
        <p
          id="tool-qr-url-hint"
          className={showError ? "text-caption text-destructive" : "text-caption text-muted-foreground"}
        >
          {showError ? dict.invalid : dict.privacy}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl bg-muted p-6">
        {/* Nền trắng cố định, không dùng token: xem ghi chú ở đầu file. */}
        <div ref={qrRef} className="rounded-2xl bg-white p-4">
          {url ? (
            <QRCode value={url} size={200} bgColor="#ffffff" fgColor="#000000" title={dict.qrTitle} />
          ) : (
            <div className="flex size-[200px] items-center justify-center text-center text-caption text-black/50">
              {dict.empty}
            </div>
          )}
        </div>
        <Button type="button" onClick={onDownload} disabled={!url}>
          <Download aria-hidden />
          {dict.download}
        </Button>
        <p className="max-w-xs text-center text-caption text-muted-foreground">{dict.hint}</p>
      </div>
    </div>
  );
}
