"use client";

import { useState } from "react";
import { Segmented, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Info } from "lucide-react";
import {
  TEMPLATE_STATS_DAYS,
  type TemplateStatsDays,
  type TemplateStatsRow,
} from "@/apis/catalog";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/components/ui/table";
import { TierBadge } from "@/components/shared/tier-badge";
import { PAGE_SIZE } from "@/constants/pagination";
import { useTemplateStatsQuery } from "@/hooks/use-catalog";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { templateCoverSrc } from "@/lib/card-preview";
import { fill, formatNumber } from "@/lib/format";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
  locale: Locale;
};

/** Tiêu đề cột kèm biểu tượng (i) giải thích con số đếm cái gì. */
function HintTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {title}
      <Tooltip title={hint}>
        <Info aria-label={hint} className="size-3.5 text-muted-foreground" />
      </Tooltip>
    </span>
  );
}

/**
 * Mẫu nào trong kho được khách bấm vào nhiều.
 *
 * "Mở mẫu" là mở hộp thoại xem nhanh trong kho mẫu hoặc trang giới thiệu mẫu;
 * "Mở demo" là mở bản thiệp đầy đủ. Đặt cạnh số thiệp tạo ra trong cùng kỳ để
 * thấy mẫu nào *được xem nhiều mà ít người dùng* — thứ đáng xem lại nhất.
 *
 * Trả về cả kho trong một lượt (vài chục mẫu) nên sắp xếp và phân trang làm
 * tại chỗ; bấm tiêu đề cột để đổi cách xếp.
 */
export function TemplateStatsTable({ dict, commonDict, locale }: Props) {
  const t = dict.templateStats;
  const [days, setDays] = useState<TemplateStatsDays>(30);
  const { data, isLoading } = useTemplateStatsQuery(days);
  const rows = data?.items ?? [];

  const totals = rows.reduce(
    (sum, row) => ({
      open: sum.open + row.openViews,
      demo: sum.demo + row.demoViews,
      cards: sum.cards + row.cardsCreated,
    }),
    { open: 0, demo: 0, cards: 0 },
  );

  const percent = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    style: "percent",
    maximumFractionDigits: 1,
  });

  const columns: ColumnsType<TemplateStatsRow> = [
    {
      title: t.columns.template,
      dataIndex: "name",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          {/* Thẻ `img` thuần: ảnh đi qua rewrite sang frontend, bộ tối ưu của
              Next không giúp gì cho bản xem trước nội bộ. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={templateCoverSrc(row)}
            alt=""
            loading="lazy"
            className="h-14 w-11 shrink-0 rounded border border-border object-cover object-top"
          />
          <div className="min-w-0">
            <div className="font-medium">{row.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <TierBadge tier={row.tier} dict={commonDict.tier} size="xs" />
              {!row.isPublished ? (
                <Badge variant="outline" size="sm">
                  {t.unpublished}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: <HintTitle title={t.columns.open} hint={t.columnHints.open} />,
      dataIndex: "openViews",
      align: "right",
      sorter: (a, b) => a.openViews - b.openViews,
      sortDirections: ["descend", "ascend"],
      render: (_, row) => (
        <span className="text-body-lg font-semibold tabular-nums">
          {formatNumber(row.openViews, locale)}
        </span>
      ),
    },
    {
      title: <HintTitle title={t.columns.demo} hint={t.columnHints.demo} />,
      dataIndex: "demoViews",
      align: "right",
      sorter: (a, b) => a.demoViews - b.demoViews,
      sortDirections: ["descend", "ascend"],
      className: "tabular-nums",
      render: (_, row) => formatNumber(row.demoViews, locale),
    },
    {
      title: t.columns.cards,
      dataIndex: "cardsCreated",
      align: "right",
      sorter: (a, b) => a.cardsCreated - b.cardsCreated,
      sortDirections: ["descend", "ascend"],
      className: "tabular-nums",
      render: (_, row) => formatNumber(row.cardsCreated, locale),
    },
    {
      title: (
        <HintTitle
          title={t.columns.conversion}
          hint={t.columnHints.conversion}
        />
      ),
      key: "conversion",
      align: "right",
      className: "tabular-nums text-muted-foreground",
      render: (_, row) =>
        row.openViews > 0
          ? percent.format(row.cardsCreated / row.openViews)
          : "—",
    },
  ];

  const summary = [
    { label: t.summary.open, value: totals.open },
    { label: t.summary.demo, value: totals.demo },
    { label: t.summary.cards, value: totals.cards },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<TemplateStatsDays>
          value={days}
          aria-label={t.periodLabel}
          onChange={setDays}
          options={TEMPLATE_STATS_DAYS.map((value) => ({
            value,
            label: t.periods[String(value) as keyof typeof t.periods],
          }))}
        />
        {data ? (
          <span className="text-caption text-muted-foreground">
            {fill(t.total, { count: rows.length })}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-card px-4 py-3 shadow-card"
          >
            <div className="text-caption text-muted-foreground">
              {item.label}
            </div>
            <div className="mt-1 text-h4 font-semibold tabular-nums">
              {formatNumber(item.value, locale)}
            </div>
          </div>
        ))}
      </div>

      <p className="text-caption text-muted-foreground">
        {data?.trackingSince
          ? fill(t.trackingSince, {
              // `YYYY-MM-DD` → `dd/mm/yyyy`.
              date: data.trackingSince.split("-").reverse().join("/"),
            })
          : data
            ? t.noTracking
            : null}{" "}
        {t.countingNote}
      </p>

      <AdminTable<TemplateStatsRow>
        columns={columns}
        dataSource={rows}
        rowKey="slug"
        loading={isLoading}
        emptyText={t.empty}
        totalLabel={dict.pagination.total}
        pagination={{ pageSize: PAGE_SIZE }}
      />
    </section>
  );
}
