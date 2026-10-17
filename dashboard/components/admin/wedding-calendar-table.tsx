"use client";

import { useState } from "react";
import { App, Segmented } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Copy } from "lucide-react";
import {
  WEDDING_SCOPES,
  type AdminCard,
  type WeddingScope,
} from "@/apis/cards";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { AdminTable } from "@/components/ui/table";
import { PAGE_SIZE } from "@/constants/pagination";
import { useWeddingsQuery } from "@/hooks/use-cards";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  daysBetween,
  fill,
  formatNumber,
  vietnamToday,
  weddingDateParts,
} from "@/lib/format";
import { CardLinkCell } from "./card-link-cell";

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
};

const WITHIN_OPTIONS = ["7", "30", "90", "all"] as const;
type Within = (typeof WITHIN_OPTIONS)[number];

/**
 * Lịch ngày cưới: thiệp xếp theo ngày cưới, gần nhất trước, kèm cách liên hệ
 * chủ thiệp — để người vận hành gửi lời chúc đúng ngày.
 *
 * Ngày cưới đọc từ ô đếm ngược của thiệp (`content.countdown.weddingDate`), là
 * trường duy nhất của nội dung thiệp mà khu quản trị nhận về; thiệp chưa nhập
 * ngày thì không có mặt ở đây.
 */
export function WeddingCalendarTable({ dict, locale }: Props) {
  const { message } = App.useApp();
  const t = dict.weddings;
  const [scope, setScope] = useState<WeddingScope>("upcoming");
  const [within, setWithin] = useState<Within>("all");
  const [page, setPage] = useState(0);
  const { data, isLoading } = useWeddingsQuery(
    scope,
    within === "all" ? null : Number(within),
    page,
    PAGE_SIZE,
  );

  const cards = data?.items ?? [];
  const total = data?.total ?? 0;
  const today = vietnamToday();
  const weekday = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      message.success(t.emailCopied);
    } catch {
      // Trình duyệt chặn clipboard: email vẫn đọc được trên màn.
    }
  }

  /** "Hôm nay" nổi bật nhất, trong tuần tới nhạt hơn, còn lại chỉ là chữ phụ. */
  function relative(days: number) {
    if (days === 0) {
      return (
        <Badge variant="success" size="sm">
          {t.today}
        </Badge>
      );
    }
    const label =
      days === 1
        ? t.tomorrow
        : days === -1
          ? t.yesterday
          : days > 0
            ? fill(t.inDays, { count: days })
            : fill(t.daysAgo, { count: -days });
    if (days > 0 && days <= 7) {
      return (
        <Badge variant="warning" size="sm">
          {label}
        </Badge>
      );
    }
    return <span className="text-caption text-muted-foreground">{label}</span>;
  }

  const columns: ColumnsType<AdminCard> = [
    {
      title: t.columns.date,
      dataIndex: "weddingDate",
      render: (_, card) => {
        const parts = weddingDateParts(card.weddingDate);
        if (!parts) return "—";
        const [year, month, day] = parts.date.split("-");
        return (
          <div className="space-y-1 whitespace-nowrap">
            <div className="font-semibold tabular-nums">
              {`${day}/${month}/${year}`}
              {parts.time ? (
                <span className="ml-2 font-normal text-muted-foreground">
                  {parts.time}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted-foreground first-letter:uppercase">
                {weekday.format(new Date(`${parts.date}T00:00:00Z`))}
              </span>
              {relative(daysBetween(today, parts.date))}
            </div>
          </div>
        );
      },
    },
    {
      title: t.columns.couple,
      dataIndex: "title",
      render: (_, card) => (
        <CardLinkCell
          card={card}
          locale={locale}
          labels={{ copy: dict.cards.copyLink, copied: dict.cards.linkCopied }}
        />
      ),
    },
    {
      title: t.columns.contact,
      dataIndex: "owner",
      render: (_, card) => (
        <div className="space-y-0.5">
          <div>{card.owner.fullName}</div>
          <div className="text-caption">
            <a
              href={`mailto:${card.owner.email}`}
              className="break-all text-primary hover:underline"
            >
              {card.owner.email}
            </a>
            <button
              type="button"
              onClick={() => copyEmail(card.owner.email)}
              title={t.copyEmail}
              aria-label={t.copyEmail}
              className="ml-1 inline-flex size-6 items-center justify-center rounded align-middle text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Copy aria-hidden className="size-3.5" />
            </button>
          </div>
          {card.owner.phone ? (
            <a
              href={`tel:${card.owner.phone}`}
              className="text-caption text-primary tabular-nums hover:underline"
            >
              {card.owner.phone}
            </a>
          ) : null}
        </div>
      ),
    },
    {
      title: t.columns.status,
      dataIndex: "status",
      render: (_, card) => (
        <Badge variant={card.status === "paid" ? "solid" : "outline"} size="sm">
          {dict.cards.status[card.status]}
        </Badge>
      ),
    },
    {
      title: t.columns.views,
      dataIndex: "viewCount",
      align: "right",
      className: "text-muted-foreground tabular-nums",
      render: (_, card) => formatNumber(card.viewCount, locale),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<WeddingScope>
          value={scope}
          onChange={(value) => {
            setScope(value);
            setPage(0);
          }}
          options={WEDDING_SCOPES.map((value) => ({
            value,
            label: t.scopes[value],
          }))}
        />
        <Select<Within>
          value={within}
          aria-label={t.withinLabel}
          onChange={(value) => {
            setWithin(value);
            setPage(0);
          }}
          className="min-w-40"
          options={WITHIN_OPTIONS.map((value) => ({
            value,
            label: t.within[value],
          }))}
        />
        {data ? (
          <span className="text-caption text-muted-foreground">
            {fill(t.total, { count: total })}
          </span>
        ) : null}
      </div>

      <AdminTable<AdminCard>
        columns={columns}
        dataSource={cards}
        rowKey="id"
        loading={isLoading}
        emptyText={scope === "upcoming" ? t.emptyUpcoming : t.emptyPast}
        totalLabel={dict.pagination.total}
        pagination={{ page, pageSize: PAGE_SIZE, total, onChange: setPage }}
      />
    </section>
  );
}
