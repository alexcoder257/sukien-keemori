"use client";

import { useId, useState } from "react";
import {
  Eye,
  FileText,
  MousePointerClick,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { HorizontalBars } from "@/components/shared/horizontal-bars";
import { GoogleAnalyticsCard } from "@/components/admin/google-analytics-card";
import { CARD_STATUSES } from "@/constants/template";
import { useAnalyticsQuery } from "@/hooks/use-analytics";
import type { AnalyticsReport } from "@/apis/analytics";
import type { DashboardOverview } from "@/apis/admin";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
  overview?: DashboardOverview;
};

type Stat = {
  icon: LucideIcon;
  label: string;
  value: number;
};

function LoadingDashboard({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl border border-border bg-card xl:col-span-2" />
        <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}

function StatCard({ stat, locale }: { stat: Stat; locale: Locale }) {
  const Icon = stat.icon;

  return (
    <li className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-small text-muted-foreground">{stat.label}</p>
          <p className="mt-2 text-h3 font-semibold tabular-nums tracking-tight">
            {formatNumber(stat.value, locale)}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon aria-hidden className="size-5" />
        </span>
      </div>
    </li>
  );
}

function chartDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

function TrafficChart({
  data,
  dict,
  locale,
}: {
  data: AnalyticsReport["traffic"]["daily"];
  dict: Dictionary["admin"]["analytics"];
  locale: Locale;
}) {
  const gradientId = useId().replaceAll(":", "");
  const width = 760;
  const height = 280;
  const padding = { top: 16, right: 18, bottom: 36, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...data.flatMap((row) => [row.visitors, row.pageViews]),
  );
  const x = (index: number) =>
    padding.left +
    (data.length <= 1
      ? plotWidth / 2
      : (index / (data.length - 1)) * plotWidth);
  const y = (value: number) =>
    padding.top + plotHeight - (value / maxValue) * plotHeight;
  const path = (key: "visitors" | "pageViews") =>
    data
      .map(
        (row, index) =>
          `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(row[key]).toFixed(2)}`,
      )
      .join(" ");
  const labelIndexes = new Set(
    [0, 0.25, 0.5, 0.75, 1].map((ratio) =>
      Math.round((data.length - 1) * ratio),
    ),
  );
  const summary = `${dict.daily}: ${formatNumber(
    data.reduce((sum, row) => sum + row.visitors, 0),
    locale,
  )} ${dict.visitors.toLocaleLowerCase()}, ${formatNumber(
    data.reduce((sum, row) => sum + row.pageViews, 0),
    locale,
  )} ${dict.pageViews.toLocaleLowerCase()}.`;

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-small text-muted-foreground">
        {dict.empty}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-caption text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-chart-1" />
          {dict.pageViews}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-chart-2" />
          {dict.visitors}
        </span>
      </div>
      <svg
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const lineY = padding.top + plotHeight * ratio;
          const value = Math.round(maxValue * (1 - ratio));
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={lineY}
                x2={width - padding.right}
                y2={lineY}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
              <text
                x={padding.left - 10}
                y={lineY + 4}
                textAnchor="end"
                fill="var(--muted-foreground)"
                fontSize="11"
              >
                {formatNumber(value, locale)}
              </text>
            </g>
          );
        })}
        <path
          d={`${path("pageViews")} L${x(data.length - 1)},${padding.top + plotHeight} L${x(0)},${padding.top + plotHeight} Z`}
          fill={`url(#${gradientId})`}
        />
        <path
          d={path("pageViews")}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path("visitors")}
          fill="none"
          stroke="var(--chart-2)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((row, index) => (
          <g key={row.day}>
            <circle
              cx={x(index)}
              cy={y(row.pageViews)}
              r="4"
              fill="var(--card)"
              stroke="var(--chart-1)"
              strokeWidth="2"
            >
              <title>{`${formatDate(row.day, locale)} · ${dict.pageViews}: ${formatNumber(row.pageViews, locale)}`}</title>
            </circle>
            <circle
              cx={x(index)}
              cy={y(row.visitors)}
              r="4"
              fill="var(--card)"
              stroke="var(--chart-2)"
              strokeWidth="2"
            >
              <title>{`${formatDate(row.day, locale)} · ${dict.visitors}: ${formatNumber(row.visitors, locale)}`}</title>
            </circle>
            {labelIndexes.has(index) ? (
              <text
                x={x(index)}
                y={height - 9}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="11"
              >
                {chartDate(row.day, locale)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Phân tích vận hành bằng dữ liệu thật từ backend. Biểu đồ SVG/CSS nhẹ hơn một
 * thư viện chart riêng, vẫn có nhãn số, tooltip native và mô tả cho screen reader.
 */
export function AnalyticsPanel({ dict, locale, overview }: Props) {
  const t = dict.analytics;
  const [days, setDays] = useState<Range>(30);
  const { data, isLoading, isError, refetch } = useAnalyticsQuery(days);

  if (isLoading || !data) {
    if (isError) {
      return (
        <div className="rounded-xl border border-destructive/40 bg-card p-6">
          <p className="text-small">{dict.errors.failed}</p>
          <Button className="mt-4" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      );
    }
    return <LoadingDashboard label={dict.loading} />;
  }

  const totalCards = Object.values(data.cardsByStatus).reduce(
    (sum, value) => sum + value,
    0,
  );
  const stats: Stat[] = [
    { icon: Users, label: t.visitors, value: data.traffic.totalVisitors },
    {
      icon: MousePointerClick,
      label: t.pageViews,
      value: data.traffic.totalPageViews,
    },
    {
      icon: FileText,
      label: t.totalCards,
      value: overview
        ? Object.values(overview.cardsByStatus).reduce(
            (sum, value) => sum + value,
            0,
          )
        : totalCards,
    },
    { icon: Eye, label: t.cardViews, value: data.totalCardViews },
  ];

  const templateRows = data.cardsByTemplate.slice(0, 8).map((row) => ({
    key: row.templateSlug,
    label: row.templateName,
    value: row.count,
  }));
  // Cùng thứ tự với `CARD_STATUSES`: nháp, đã xuất bản.
  const statusColors = ["var(--chart-5)", "var(--chart-2)"];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-body-lg font-semibold">{t.snapshot}</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            {t.visitorHint}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-small text-muted-foreground">
            {t.rangeLabel}
          </span>
          <Select<Range>
            value={days}
            onChange={setDays}
            aria-label={t.rangeLabel}
            options={RANGES.map((value) => ({
              value,
              label: t.range[String(value) as keyof typeof t.range],
            }))}
          />
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} locale={locale} />
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5 shadow-card xl:col-span-2">
          <div className="mb-5">
            <h2 className="text-body-lg font-semibold">{t.daily}</h2>
            <p className="mt-1 text-caption text-muted-foreground">
              {t.dailyHint}
            </p>
          </div>
          <TrafficChart data={data.traffic.daily} dict={t} locale={locale} />
        </article>

        <article className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-body-lg font-semibold">{t.byStatus}</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            {t.statusHint}
          </p>
          <div className="mt-6">
            <HorizontalBars
              rows={CARD_STATUSES.map((status, index) => ({
                key: status,
                label: dict.cards.status[status],
                value: data.cardsByStatus[status] ?? 0,
                color: statusColors[index],
              }))}
              locale={locale}
              empty={t.empty}
            />
          </div>
        </article>
      </div>

      <GoogleAnalyticsCard dict={t} locale={locale} days={days} />

      <div className="grid gap-6">
        <article className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-body-lg font-semibold">{t.byTemplate}</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            {t.templateHint}
          </p>
          <div className="mt-6">
            <HorizontalBars
              rows={templateRows}
              locale={locale}
              empty={t.empty}
            />
          </div>
        </article>

      </div>

      <details className="rounded-xl border border-border bg-card px-5 py-4 shadow-card text-small">
        <summary className="cursor-pointer font-medium">{t.dataTable}</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-96 border-collapse text-left">
            <thead className="text-caption text-muted-foreground">
              <tr>
                <th className="border-b border-border py-2 pr-4 font-medium">
                  {t.date}
                </th>
                <th className="border-b border-border px-4 py-2 text-right font-medium">
                  {t.visitors}
                </th>
                <th className="border-b border-border py-2 pl-4 text-right font-medium">
                  {t.pageViews}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.traffic.daily.map((row) => (
                <tr key={row.day}>
                  <td className="border-b border-border py-2 pr-4">
                    {formatDate(row.day, locale)}
                  </td>
                  <td className="border-b border-border px-4 py-2 text-right tabular-nums">
                    {formatNumber(row.visitors, locale)}
                  </td>
                  <td className="border-b border-border py-2 pl-4 text-right tabular-nums">
                    {formatNumber(row.pageViews, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
