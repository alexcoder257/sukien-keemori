"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HorizontalBars } from "@/components/shared/horizontal-bars";
import { GOOGLE_ANALYTICS_URL } from "@/constants/analytics";
import { useGoogleAnalyticsQuery } from "@/hooks/use-analytics";
import type { GoogleAnalyticsRow } from "@/apis/analytics";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatDuration, formatNumber } from "@/lib/format";

type Dict = Dictionary["admin"]["analytics"];

type Props = {
  dict: Dict;
  locale: Locale;
  days: number;
};

/**
 * GA trả nhóm kênh bằng tiếng Anh và không dịch được qua tham số API, nên nhãn
 * dịch ở đây. Giá trị lạ (GA thêm nhóm mới, hoặc `Unassigned`) rơi về chính
 * chuỗi gốc — thà hiện tiếng Anh còn hơn nuốt mất một dòng số liệu.
 */
function channelLabel(key: string, dict: Dict): string {
  const map: Record<string, string> = {
    "Organic Search": dict.channel.organicSearch,
    Direct: dict.channel.direct,
    Referral: dict.channel.referral,
    "Organic Social": dict.channel.organicSocial,
    "Paid Search": dict.channel.paidSearch,
    Email: dict.channel.email,
    Unassigned: dict.channel.unassigned,
  };
  return map[key] ?? key;
}

function deviceLabel(key: string, dict: Dict): string {
  const map: Record<string, string> = {
    mobile: dict.device.mobile,
    desktop: dict.device.desktop,
    tablet: dict.device.tablet,
  };
  return map[key] ?? key;
}

function percent(value: number, locale: Locale): string {
  return `${formatNumber(value * 100, locale, 1)}%`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-h4 font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  locale,
  empty,
}: {
  title: string;
  rows: { key: string; label: string; value: number }[];
  locale: Locale;
  empty: string;
}) {
  return (
    <div>
      <h3 className="mb-4 text-small font-medium">{title}</h3>
      <HorizontalBars rows={rows} locale={locale} empty={empty} />
    </div>
  );
}

function toRows(
  rows: GoogleAnalyticsRow[],
  label: (key: string) => string,
): { key: string; label: string; value: number }[] {
  return rows.map((row) => ({
    key: row.key,
    label: label(row.key),
    value: row.value,
  }));
}

/**
 * Khối Google Analytics trong màn Phân tích.
 *
 * **Cố ý không lặp lại lưu lượng.** Tổng lượt xem và khách theo ngày đã có ở
 * biểu đồ phía trên, đo bằng `daily_visits` — nguồn đó không bị ad-blocker chặn
 * và có tính cả trang thiệp, nên nó luôn cao hơn GA. Đặt hai con số cùng tên
 * cạnh nhau là bảo người vận hành đi tìm một lỗi không tồn tại; ở đây chỉ hiện
 * thứ GA đo được mà mình thì không: khách *đến từ đâu*, *thiết bị gì*, *xem
 * trang nào*.
 *
 * Chưa cấu hình service account thì backend trả `configured: false` và khối này
 * hiện lời nhắc, không hiện số 0 — "chưa kết nối" khác "không có ai truy cập".
 * Lỗi mạng cũng chỉ làm hỏng khối này; phần dữ liệu của mình ở trên còn nguyên.
 */
export function GoogleAnalyticsCard({ dict, locale, days }: Props) {
  const { data, isLoading, isError } = useGoogleAnalyticsQuery(days);

  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-body-lg font-semibold">{dict.googleTitle}</h2>
        <p className="mt-1 text-caption text-muted-foreground">
          {dict.googleHint}
        </p>
      </div>
      <Button
        variant="outline"
        href={GOOGLE_ANALYTICS_URL}
        target="_blank"
        rel="noreferrer"
        title={dict.googleAnalyticsHint}
      >
        <ExternalLink aria-hidden className="size-4" />
        {dict.googleAnalytics}
      </Button>
    </div>
  );

  let body: React.ReactNode;

  if (isLoading) {
    body = (
      <div
        aria-busy="true"
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-lg border border-border bg-secondary"
          />
        ))}
      </div>
    );
  } else if (isError) {
    body = (
      <p className="mt-6 text-small text-muted-foreground">
        {dict.googleError}
      </p>
    );
  } else if (!data?.configured) {
    body = (
      <p className="mt-6 text-small text-muted-foreground">
        {dict.googleNotConfigured}
      </p>
    );
  } else {
    body = (
      <>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label={dict.sessions}
            value={formatNumber(data.sessions, locale)}
          />
          <Stat
            label={dict.engagementRate}
            value={percent(data.engagementRate, locale)}
          />
          <Stat
            label={dict.avgSessionDuration}
            value={formatDuration(data.averageSessionDuration)}
          />
          <Stat
            label={dict.newUserRate}
            value={percent(data.newUserRate, locale)}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <Breakdown
            title={dict.byChannel}
            rows={toRows(data.channels, (key) => channelLabel(key, dict))}
            locale={locale}
            empty={dict.empty}
          />
          <Breakdown
            title={dict.byDevice}
            rows={toRows(data.devices, (key) => deviceLabel(key, dict))}
            locale={locale}
            empty={dict.empty}
          />
          <Breakdown
            title={dict.topPages}
            rows={toRows(data.topPages, (key) => key)}
            locale={locale}
            empty={dict.empty}
          />
        </div>
      </>
    );
  }

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-card">
      {header}
      {body}
    </article>
  );
}
