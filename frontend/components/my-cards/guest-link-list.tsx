"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GUEST_QUERY_PARAM } from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import type { GuestLink } from "@/lib/data/invitations";
import type { Rsvp } from "@/lib/schemas/invitation";

/** Tên miền không đổi trong suốt vòng đời trang, nên không có gì để lắng nghe. */
const subscribeNever = () => () => {};

type Props = {
  guests: GuestLink[];
  /** Đường dẫn công khai của thiệp, đã gồm locale: `/vi/t/<slug>`. */
  path: string;
  dict: Dictionary["myCards"]["guests"];
  /**
   * Phản hồi tham dự theo `guestId`. `undefined` là không hiện cột trạng thái —
   * thiệp không bật xác nhận tham dự thì "Chưa phản hồi" ở mọi dòng chỉ là nhiễu.
   */
  responses?: Map<string, Rsvp>;
};

/**
 * Danh sách link mời riêng: mỗi khách một dòng, chép từng link hoặc chép cả
 * loạt dạng "Tên: link" để dán vào ghi chú rồi gửi lần lượt qua Zalo/Messenger.
 *
 * Link dựng ở trình duyệt từ `window.location.origin`, cùng lý do với
 * `ShareLinkDialog`: tên miền người dùng đang đứng luôn là tên miền đúng.
 */
export function GuestLinkList({ guests, path, dict, responses }: Props) {
  // Trang này đi qua render phía server, nên server trả chuỗi rỗng (nút chép bị
  // khoá) và trình duyệt điền tên miền thật lúc hydrate — không lệch markup.
  const origin = useSyncExternalStore(
    subscribeNever,
    () => window.location.origin,
    () => "",
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedId) return;
    const timer = setTimeout(() => setCopiedId(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedId]);

  const urlOf = (guest: GuestLink) =>
    `${origin}${path}?${new URLSearchParams({ [GUEST_QUERY_PARAM]: guest.token })}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      toast.error(dict.copyFailed);
      return false;
    }
  };

  const onCopyAll = async () => {
    const text = guests
      .map((guest) => `${guest.name}: ${urlOf(guest)}`)
      .join("\n");
    if (await copy(text)) {
      toast.success(fill(dict.copiedAll, { count: guests.length }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-muted-foreground">
          {fill(dict.count, { count: guests.length })}
          {responses
            ? ` · ${fill(dict.rsvpResponded, {
                count: guests.filter((guest) => responses.has(guest.id)).length,
              })}`
            : null}
        </p>
        <Button
          size="sm"
          className="gap-2"
          onClick={onCopyAll}
          disabled={!origin || guests.length === 0}
        >
          <Copy aria-hidden className="size-4" />
          {dict.copyAll}
        </Button>
      </div>

      <ul className="flex flex-col divide-y divide-foreground/10 rounded-2xl bg-card ring-1 ring-foreground/10">
        {guests.map((guest) => {
          const url = origin ? urlOf(guest) : "";
          const copied = copiedId === guest.id;
          const response = responses?.get(guest.id);
          return (
            <li
              key={guest.id}
              // Dưới `sm` một khách một hàng, không xuống dòng: để wrap thì
              // khối chữ (`basis-56`) cộng cụm nút đã vượt bề ngang, hai nút rớt
              // xuống hàng riêng và mỗi khách chiếm gấp đôi chiều cao.
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 max-sm:flex-nowrap max-sm:gap-x-2"
            >
              <div className="min-w-0 flex-1 basis-56 max-sm:basis-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-body font-medium">{guest.name}</p>
                  {responses ? (
                    <Badge
                      variant={response?.attending ? "solid" : "outline"}
                      size="xs"
                    >
                      {!response
                        ? dict.rsvpPending
                        : response.attending
                          ? fill(dict.rsvpAttending, {
                              count: response.partySize,
                            })
                          : dict.rsvpDeclined}
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-caption text-muted-foreground">
                  {url}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={url || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={fill(dict.open, { name: guest.name })}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
                >
                  <ExternalLink aria-hidden className="size-4" />
                </a>
                {/* Dưới `sm` chỉ còn icon, vuông bằng nút mở link bên cạnh: chữ
                    "Sao chép" lặp lại ở mọi dòng là thứ chiếm chỗ của tên khách.
                    Nhãn vẫn đọc được cho trình đọc màn hình qua `sr-only`. */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 max-sm:w-9 max-sm:px-0"
                  disabled={!origin}
                  onClick={async () => {
                    if (await copy(url)) setCopiedId(guest.id);
                  }}
                >
                  {copied ? (
                    <Check aria-hidden className="size-4" />
                  ) : (
                    <Copy aria-hidden className="size-4" />
                  )}
                  <span className="max-sm:sr-only">
                    {copied ? dict.copied : dict.copy}
                  </span>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
