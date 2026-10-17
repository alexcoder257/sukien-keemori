"use client";

import {
  BadgeCheck,
  FileText,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnalyticsPanel } from "@/components/admin/analytics-panel";
import { Button } from "@/components/ui/button";
import { CARD_STATUSES } from "@/constants/template";
import { useDashboardOverviewQuery } from "@/hooks/use-admin";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
  /** Có quyền `analytics:view` — hiện thêm khối phân tích; backend cũng gác lại. */
  canViewAnalytics: boolean;
};

type Metric = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;

  return (
    <li className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-caption text-muted-foreground">{metric.label}</p>
          <p className="mt-0.5 truncate text-body-lg font-semibold tabular-nums">
            {metric.value}
          </p>
        </div>
      </div>
    </li>
  );
}

export function OverviewPanel({
  dict,
  locale,
  canViewAnalytics,
}: Props) {
  const { data, isLoading, isError, refetch } = useDashboardOverviewQuery();
  const t = dict.overview;

  if (isLoading || !data) {
    if (isError) {
      return (
        <div className="rounded-xl border border-destructive/40 bg-card p-6">
          <p className="text-small">{dict.errors.failed}</p>
          <Button className="mt-4" onClick={() => refetch()}>
            {dict.analytics.retry}
          </Button>
        </div>
      );
    }

    return (
      <div aria-busy="true" aria-label={dict.loading} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  const totalCards = Object.values(data.cardsByStatus).reduce(
    (sum, value) => sum + value,
    0,
  );
  const metrics: Metric[] = [
    {
      icon: Users,
      label: t.totalUsers,
      value: formatNumber(data.users, locale),
    },
    {
      icon: FileText,
      label: t.totalCards,
      value: formatNumber(totalCards, locale),
    },
    {
      icon: BadgeCheck,
      label: dict.cards.status.paid,
      value: formatNumber(data.cardsByStatus.paid ?? 0, locale),
    },
  ];

  if (canViewAnalytics) {
    return (
      <div className="space-y-8">
        <section aria-labelledby="operations-heading" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="operations-heading" className="text-body-lg font-semibold">
                {t.operations}
              </h2>
              <p className="mt-1 text-caption text-muted-foreground">
                {t.operationsHint}
              </p>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </ul>
        </section>

        <AnalyticsPanel
          dict={dict}
          locale={locale}
          overview={data}
        />
      </div>
    );
  }

  const maxStatus = Math.max(1, ...Object.values(data.cardsByStatus));

  return (
    <div className="space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </ul>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-body-lg font-semibold">{dict.analytics.byStatus}</h2>
        <p className="mt-1 text-caption text-muted-foreground">
          {dict.analytics.statusHint}
        </p>
        <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {CARD_STATUSES.map((status) => {
            const value = data.cardsByStatus[status] ?? 0;
            return (
              <li key={status}>
                <div className="mb-2 flex items-center justify-between gap-4 text-small">
                  <span>{dict.cards.status[status]}</span>
                  <strong className="tabular-nums">
                    {formatNumber(value, locale)}
                  </strong>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(value / maxStatus) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="rounded-xl bg-secondary px-4 py-3 text-small text-muted-foreground">
        {t.analyticsRestricted}
      </p>
    </div>
  );
}
