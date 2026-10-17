"use client";

import { useState } from "react";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatDateTime } from "@/lib/format";
import type { Wish } from "@/lib/schemas/invitation";

type Filter = "all" | "pending" | "approved";

type Props = {
  wishes: Wish[];
  dict: Dictionary["editor"]["blocks"]["wishes"];
  locale: Locale;
  /** Đổi trạng thái duyệt của một lời chúc. */
  onApprovedChange: (id: string, approved: boolean) => void;
  onDelete: (id: string) => void;
};

/**
 * Danh sách kiểm duyệt sổ lưu bút: lọc theo trạng thái, duyệt/ẩn và xoá.
 *
 * Nằm ở `shared/` vì đúng màn này xuất hiện ở hai domain — thẻ "Sổ lưu bút"
 * trong editor và trang quản lý lời chúc trong "Thiệp của tôi". Component
 * không tự sửa dữ liệu: nó nhận danh sách và trả về ý định, để mỗi nơi tự nối
 * vào nguồn của mình (form của editor, state của trang quản lý, và sau này là
 * mutation React Query).
 *
 * Xoá không hỏi lại: đây là lời chúc của khách chứ không phải nội dung chủ
 * thiệp soạn, và hành động đối trọng — "Ẩn khỏi thiệp" — đã đứng ngay cạnh cho
 * ai chỉ muốn giấu đi. Dialog xác nhận dành cho thứ xoá cả tấm thiệp.
 */
export function WishModerationList({
  wishes,
  dict,
  locale,
  onApprovedChange,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const pendingCount = wishes.filter((wish) => !wish.approved).length;
  const approvedCount = wishes.length - pendingCount;

  // Mới nhất trước, giống thứ tự trên thiệp: chủ thiệp mở ra là thấy ngay lời
  // chúc vừa tới, thứ duy nhất cần họ xử lý.
  const visible = wishes
    .filter((wish) =>
      filter === "all" ? true : filter === "pending" ? !wish.approved : wish.approved,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (wishes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-foreground/20 px-4 py-8 text-center text-small text-muted-foreground">
        {dict.empty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-muted-foreground">
          {fill(dict.pendingCount, { count: pendingCount })} ·{" "}
          {fill(dict.approvedCount, { count: approvedCount })}
        </p>
        <SegmentedControl
          aria-label={dict.title}
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "all", label: dict.filterAll },
            { value: "pending", label: dict.filterPending },
            { value: "approved", label: dict.filterApproved },
          ]}
        />
      </div>

      <ul className="flex flex-col gap-3">
        {visible.map((wish) => (
          <li
            key={wish.id}
            className="flex flex-col gap-3 rounded-xl border border-foreground/12 bg-foreground/3 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">{wish.name}</span>
              <time
                dateTime={wish.createdAt}
                className="text-caption text-muted-foreground"
              >
                {formatDateTime(wish.createdAt, locale)}
              </time>
              <Badge
                variant={wish.approved ? "solid" : "outline"}
                size="xs"
                className="ml-auto"
              >
                {wish.approved ? dict.approved : dict.pending}
              </Badge>
            </div>

            <p className="text-small whitespace-pre-line text-muted-foreground">
              {wish.message}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={wish.approved ? "outline" : "default"}
                className="gap-2"
                onClick={() => onApprovedChange(wish.id, !wish.approved)}
              >
                {wish.approved ? <EyeOff aria-hidden /> : <Check aria-hidden />}
                {wish.approved ? dict.unapprove : dict.approve}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => onDelete(wish.id)}
              >
                <Trash2 aria-hidden />
                {dict.delete}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
