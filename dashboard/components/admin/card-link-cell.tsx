"use client";

import { App } from "antd";
import { Copy } from "lucide-react";
import type { AdminCard } from "@/apis/cards";
import type { Locale } from "@/i18n/config";
import { cardPublicUrl } from "@/lib/card-preview";

type Props = {
  card: Pick<AdminCard, "slug" | "title" | "status">;
  locale: Locale;
  labels: { copy: string; copied: string };
  /** Chữ nhỏ đứng trước tên thiệp, ví dụ thứ hạng. */
  prefix?: React.ReactNode;
};

/**
 * Tên thiệp + link công khai đầy đủ + nút chép link — cùng cách hiển thị với
 * bảng "Thiệp đã tạo". Link mở ở **chính tab này**, như ở bảng đó.
 */
export function CardLinkCell({ card, locale, labels, prefix }: Props) {
  const { message } = App.useApp();
  const url = cardPublicUrl(card.slug, locale);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      message.success(labels.copied);
    } catch {
      // Trình duyệt chặn clipboard (http không an toàn): link vẫn đọc được trên màn.
    }
  }

  return (
    <div className="min-w-0">
      <div className="font-medium">
        {prefix}
        {card.title || card.slug}
      </div>
      <div className="text-caption text-muted-foreground">
        {card.status === "draft" ? (
          <span className="break-all">{url}</span>
        ) : (
          <>
            <a href={url} className="break-all text-primary hover:underline">
              {url}
            </a>
            <button
              type="button"
              onClick={copy}
              title={labels.copy}
              aria-label={labels.copy}
              className="ml-1 inline-flex size-6 items-center justify-center rounded align-middle text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Copy aria-hidden className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
