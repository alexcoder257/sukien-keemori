"use client";

import { useRef, useState } from "react";
import { App } from "antd";
import { Upload, X } from "lucide-react";
import type { UploadedImage } from "@/apis/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CoverImageLabels = {
  upload: string;
  uploading: string;
  uploadFailed: string;
  remove: string;
  hint: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  labels: CoverImageLabels;
  /** `id` của ô chữ, để `<Label htmlFor>` trỏ đúng khi một form có hai ô ảnh. */
  id?: string;
  /** Đường tải lên ảnh. */
  upload: (file: File) => Promise<UploadedImage>;
  /** Khung bản xem trước; mặc định cao 24 theo tỉ lệ ảnh. */
  previewClassName?: string;
};

/** Ảnh bìa / ảnh chụp dài: tải lên hoặc gõ tay đường dẫn có sẵn trong repo. */
export function CoverImageField({
  value,
  onChange,
  invalid,
  labels,
  id = "coverSrc",
  upload,
  previewClassName = "h-24",
}: Props) {
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await upload(file);
      onChange(url);
    } catch {
      message.error(labels.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {uploading ? labels.uploading : labels.upload}
        </Button>
      </div>

      {value ? (
        <div className="relative w-fit">
          {/* Thẻ `img` thuần chứ không `next/image`: đây là bản xem trước trong
              CMS, ảnh vừa tải lên chưa biết kích thước, và bộ tối ưu của Next
              không giúp gì cho một ảnh chỉ hiện với người vận hành. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className={cn(
              previewClassName,
              "rounded-md border border-input object-cover object-top",
            )}
          />
          <button
            type="button"
            aria-label={labels.remove}
            title={labels.remove}
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : null}

      <p className="text-caption text-muted-foreground">{labels.hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/webp,image/avif,image/jpeg,image/png"
        hidden
        onChange={onPick}
      />
    </div>
  );
}
