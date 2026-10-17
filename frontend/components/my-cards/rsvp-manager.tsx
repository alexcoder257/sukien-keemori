"use client";

import { useState } from "react";
import { Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/apis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCardRsvpsQuery, useDeleteRsvpMutation } from "@/hooks/use-rsvp";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatDateTime } from "@/lib/format";
import type { Rsvp } from "@/lib/schemas/invitation";

type Filter = "all" | "attending" | "declined";

type Props = {
  cardId: string;
  /** Danh sách trang server-render nạp sẵn; bỏ trống thì hook tự gọi (editor). */
  rsvps?: Rsvp[];
  dict: Dictionary["editor"]["blocks"]["rsvp"];
  locale: Locale;
};

/**
 * Danh sách phản hồi tham dự của chủ thiệp: ba con số tổng và từng dòng phản
 * hồi. Dùng chung ở thẻ "Xác nhận tham dự" trong editor và trang riêng trong
 * "Thiệp của tôi", giống `WishManager`.
 *
 * Con số đầu tiên là **số người** sẽ đến, không phải số phản hồi: một dòng
 * "Anh Chị Cường Thu · 2 người" là hai suất ở tiệc, và câu cặp đôi thật sự cần
 * trả lời nhà hàng là đặt bao nhiêu mâm.
 *
 * Chỉ có hành động xoá, không có sửa: đây là câu trả lời của khách. Xoá không
 * hỏi lại, cùng lý do với lời chúc.
 */
export function RsvpManager({
  cardId,
  rsvps: initial,
  dict,
  locale,
}: Props) {
  const { data: rsvps = [] } = useCardRsvpsQuery(cardId, initial);
  const remove = useDeleteRsvpMutation(cardId);
  const [filter, setFilter] = useState<Filter>("all");

  const attending = rsvps.filter((rsvp) => rsvp.attending);
  const guestsComing = attending.reduce((sum, rsvp) => sum + rsvp.partySize, 0);
  const declinedCount = rsvps.length - attending.length;

  const visible = rsvps.filter((rsvp) =>
    filter === "all"
      ? true
      : filter === "attending"
        ? rsvp.attending
        : !rsvp.attending,
  );

  const onDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => toast.success(dict.deleteDone),
      onError: (error) =>
        toast.error(
          error instanceof ApiError ? error.message : dict.actionFailed,
        ),
    });
  };

  if (rsvps.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-foreground/20 px-4 py-8 text-center text-small text-muted-foreground">
        {dict.empty}
      </p>
    );
  }

  const stats = [
    { label: dict.guestsComing, value: guestsComing },
    { label: dict.attendingCount, value: attending.length },
    { label: dict.declinedCount, value: declinedCount },
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-3 max-sm:gap-2">
        {stats.map((stat) => (
          // `justify-between`: trên màn hẹp nhãn gãy một hoặc hai dòng tuỳ ô,
          // đẩy con số về đáy ô thì ba con số vẫn nằm trên cùng một đường.
          <div
            key={stat.label}
            className="flex flex-col justify-between gap-1 rounded-xl bg-foreground/3 px-4 py-3 ring-1 ring-foreground/10 max-sm:px-3"
          >
            <dt className="text-caption text-muted-foreground">{stat.label}</dt>
            <dd className="text-h4 font-medium tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <SegmentedControl
        aria-label={dict.title}
        value={filter}
        onValueChange={setFilter}
        className="max-sm:flex max-sm:*:flex-1 max-sm:*:justify-center max-sm:*:px-2"
        options={[
          { value: "all", label: dict.filterAll },
          { value: "attending", label: dict.filterAttending },
          { value: "declined", label: dict.filterDeclined },
        ]}
      />

      <ul className="flex flex-col divide-y divide-foreground/10 rounded-xl ring-1 ring-foreground/12">
        {visible.map((rsvp) => (
          <li
            key={rsvp.id}
            // Dưới `sm` không xuống dòng: tên co lại, badge và nút xoá luôn đứng
            // ở mép phải. Để wrap thì hai thứ đó rơi xuống hàng hay không là tuỳ
            // độ dài tên, và mỗi dòng một bố cục.
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 max-sm:flex-nowrap max-sm:gap-x-2"
          >
            <div className="min-w-0 flex-1 basis-48 max-sm:basis-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium">{rsvp.name}</span>
                {rsvp.guestId ? (
                  <Badge
                    variant="outline"
                    size="xs"
                    className="gap-1"
                    title={dict.personalLinkHint}
                  >
                    <Link2 aria-hidden className="size-3" />
                    {dict.personalLink}
                  </Badge>
                ) : null}
              </div>
              <time
                dateTime={rsvp.updatedAt}
                className="text-caption text-muted-foreground"
              >
                {formatDateTime(rsvp.updatedAt, locale)}
              </time>
            </div>
            <Badge variant={rsvp.attending ? "solid" : "outline"} size="xs">
              {rsvp.attending
                ? fill(dict.partyOf, { count: rsvp.partySize })
                : dict.declined}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(rsvp.id)}
              aria-label={fill(dict.deleteLabel, { name: rsvp.name })}
              // `border-b-0!`: biến thể `ghost` kẻ viền dưới (kiểu link), mà
              // dưới một icon thùng rác nó đọc ra như gạch chân lạc chỗ — cùng
              // cách nút chuông ở `site-header.tsx` tắt nó.
              className="size-9 shrink-0 border-b-0! text-muted-foreground hover:text-destructive"
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
