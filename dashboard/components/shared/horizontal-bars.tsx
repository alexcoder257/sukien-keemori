"use client";

import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export type HorizontalBarRow = {
  key: string;
  label: string;
  value: number;
  color?: string;
};

/**
 * Bảng phân bổ dạng thanh ngang.
 *
 * Tách khỏi `analytics-panel.tsx` khi khối Google Analytics cần đúng cách vẽ
 * này cho kênh, thiết bị và trang. Không dùng thư viện chart: mỗi dòng đã có
 * nhãn số bên phải, nên thanh chỉ là bổ trợ thị giác và một `div` bo tròn làm
 * được.
 */
export function HorizontalBars({
  rows,
  locale,
  empty,
}: {
  rows: HorizontalBarRow[];
  locale: Locale;
  empty: string;
}) {
  const maxValue = Math.max(0, ...rows.map((row) => row.value));

  if (maxValue === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center text-small text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="mb-1.5 flex items-center justify-between gap-4 text-small">
            <span className="truncate">{row.label}</span>
            <span className="font-medium tabular-nums">
              {formatNumber(row.value, locale)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-chart-1 transition-[width] duration-300 motion-reduce:transition-none"
              style={{
                width: `${Math.max((row.value / maxValue) * 100, 2)}%`,
                backgroundColor: row.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
