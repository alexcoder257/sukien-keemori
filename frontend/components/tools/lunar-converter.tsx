"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import {
  lunarToSolar,
  lunarYearCanChi,
  solarToLunar,
  type SolarDate,
} from "@/lib/lunar";

type Dict = Dictionary["tools"]["items"]["lunar"]["widget"];
type Mode = "solar" | "lunar";

type Props = { dict: Dict };

function parseIsoDate(value: string): SolarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: +match[1], month: +match[2], day: +match[3] };
}

function toIsoDate({ year, month, day }: SolarDate): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const noSubscription = () => () => {};

/**
 * Ngày hôm nay theo máy người xem, dạng `YYYY-MM-DD`; chuỗi rỗng khi render ở
 * server. Trang được dựng tĩnh, lấy ngày lúc render ở server là lấy ngày build,
 * còn đặt bằng `setState` trong effect thì render hai lần.
 */
function useTodayIso(): string {
  return useSyncExternalStore(
    noSubscription,
    () => {
      const now = new Date();
      return toIsoDate({
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
    },
    () => "",
  );
}

/**
 * Đổi ngày dương ↔ âm lịch và dựng sẵn dòng ghi ngày âm cho thiệp.
 *
 * Dùng đúng `lib/lunar.ts` mà mẫu thiệp dùng để in ngày âm, nên con số ở đây
 * trùng khít con số trên thiệp. Ô nào người dùng chưa sửa thì hiển thị theo
 * ngày hôm nay (`useTodayIso`), nên state chỉ giữ thứ người dùng đã gõ.
 */
export function LunarConverter({ dict }: Props) {
  const [mode, setMode] = useState<Mode>("solar");
  const [solarEdited, setSolarInput] = useState<string | null>(null);
  const [dayEdited, setLunarDay] = useState<string | null>(null);
  const [monthEdited, setLunarMonth] = useState<string | null>(null);
  const [yearEdited, setLunarYear] = useState<string | null>(null);
  const [leap, setLeap] = useState(false);
  const [copied, setCopied] = useState(false);

  const todayIso = useTodayIso();
  const todayLunar = useMemo(() => {
    const today = parseIsoDate(todayIso);
    return today ? solarToLunar(today.day, today.month, today.year) : null;
  }, [todayIso]);

  const solarInput = solarEdited ?? todayIso;
  const lunarDay = dayEdited ?? (todayLunar ? String(todayLunar.day) : "");
  const lunarMonth = monthEdited ?? (todayLunar ? String(todayLunar.month) : "");
  const lunarYear = yearEdited ?? (todayLunar ? String(todayLunar.year) : "");

  const result = useMemo(() => {
    if (mode === "solar") {
      const solar = parseIsoDate(solarInput);
      if (!solar) return null;
      return { solar, lunar: solarToLunar(solar.day, solar.month, solar.year) };
    }
    const day = Number(lunarDay);
    const month = Number(lunarMonth);
    const year = Number(lunarYear);
    if (!day || !month || !year || day > 30 || month > 12 || year < 1900 || year > 2199) {
      return null;
    }
    const solar = lunarToSolar(day, month, year, leap);
    if (!solar) return { invalid: true as const };
    return {
      solar,
      lunar: { day, month, year, leap, canChi: lunarYearCanChi(year) },
    };
  }, [mode, solarInput, lunarDay, lunarMonth, lunarYear, leap]);

  const ready = result && !("invalid" in result) ? result : null;
  const leapLabel = ready?.lunar.leap ? dict.leapSuffix : "";
  const cardLine = ready
    ? fill(dict.cardLine, {
        day: ready.lunar.day,
        month: ready.lunar.month,
        leap: leapLabel,
        canChi: ready.lunar.canChi,
      })
    : "";

  const copyCardLine = async () => {
    try {
      await navigator.clipboard.writeText(cardLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Trình duyệt chặn clipboard: dòng chữ vẫn hiện để chép tay.
    }
  };

  return (
    <div className="grid gap-8 rounded-2xl border border-border p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      <div className="space-y-6">
        <SegmentedControl
          aria-label={dict.modeLabel}
          value={mode}
          onValueChange={setMode}
          className="max-sm:flex max-sm:*:flex-1 max-sm:*:justify-center"
          options={[
            { value: "solar", label: dict.modeSolar },
            { value: "lunar", label: dict.modeLunar },
          ]}
        />

        {mode === "solar" ? (
          <div className="space-y-2">
            <Label htmlFor="tool-solar-date">{dict.solarLabel}</Label>
            <Input
              id="tool-solar-date"
              type="date"
              value={solarInput}
              min="1900-01-01"
              max="2199-12-31"
              onChange={(event) => setSolarInput(event.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["tool-lunar-day", dict.lunarDay, lunarDay, setLunarDay, 1, 30],
                  ["tool-lunar-month", dict.lunarMonth, lunarMonth, setLunarMonth, 1, 12],
                  ["tool-lunar-year", dict.lunarYear, lunarYear, setLunarYear, 1900, 2199],
                ] as const
              ).map(([id, label, value, setValue, min, max]) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-3 text-small">
              <Checkbox
                checked={leap}
                onCheckedChange={(checked) => setLeap(checked === true)}
              />
              {dict.leapLabel}
            </label>
          </div>
        )}
      </div>

      <div aria-live="polite" className="space-y-5 rounded-xl bg-muted p-6">
        {ready ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-caption tracking-[0.12em] text-muted-foreground uppercase">
                  {dict.resultSolar}
                </dt>
                <dd className="mt-1 text-body-lg font-medium">
                  {fill(dict.solarLine, {
                    weekday:
                      dict.weekdays[
                        new Date(
                          Date.UTC(ready.solar.year, ready.solar.month - 1, ready.solar.day),
                        ).getUTCDay()
                      ],
                    day: ready.solar.day,
                    month: ready.solar.month,
                    year: ready.solar.year,
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-caption tracking-[0.12em] text-muted-foreground uppercase">
                  {dict.resultLunar}
                </dt>
                <dd className="mt-1 text-body-lg font-medium">
                  {fill(dict.lunarLine, {
                    day: ready.lunar.day,
                    month: ready.lunar.month,
                    leap: leapLabel,
                    canChi: ready.lunar.canChi,
                  })}
                </dd>
              </div>
            </dl>
            <div className="space-y-3 border-t border-border pt-5">
              <p className="text-caption tracking-[0.12em] text-muted-foreground uppercase">
                {dict.cardLineLabel}
              </p>
              <p className="font-editorial text-h4">{cardLine}</p>
              <Button type="button" variant="outline" size="sm" onClick={copyCardLine}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? dict.copied : dict.copy}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-small text-muted-foreground">
            {result && "invalid" in result ? dict.invalid : dict.empty}
          </p>
        )}
      </div>
    </div>
  );
}
