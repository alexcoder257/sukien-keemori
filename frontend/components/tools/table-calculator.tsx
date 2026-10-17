"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/i18n/dictionaries";

type Dict = Dictionary["tools"]["items"]["tables"]["widget"];

type Props = { dict: Dict };

/** Số nguyên không âm từ ô nhập; ô trống là 0. */
function count(value: string): number {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

/**
 * Tính số bàn tiệc cưới từ danh sách khách.
 *
 * Tỉ lệ khách đến **do người dùng tự đặt**: không có con số chung nào đúng cho
 * mọi đám cưới, nên số mặc định chỉ là điểm khởi đầu và được ghi rõ như vậy
 * ngay dưới ô. Khách đã xác nhận được tính đủ, tỉ lệ chỉ áp lên phần còn lại.
 */
export function TableCalculator({ dict }: Props) {
  const [guests, setGuests] = useState("300");
  const [confirmed, setConfirmed] = useState("");
  const [rate, setRate] = useState("80");
  const [perTable, setPerTable] = useState("10");
  const [reserve, setReserve] = useState("1");

  const total = count(guests);
  const sure = Math.min(count(confirmed), total);
  const percent = Math.min(count(rate), 100);
  const seats = Math.max(count(perTable), 1);
  const expected = sure + Math.round(((total - sure) * percent) / 100);
  const tables = Math.ceil(expected / seats) + count(reserve);
  const spare = tables * seats - expected;

  const fields = [
    { id: "tool-guests", label: dict.guests, value: guests, set: setGuests, hint: null },
    { id: "tool-confirmed", label: dict.confirmed, value: confirmed, set: setConfirmed, hint: dict.confirmedHint },
    { id: "tool-rate", label: dict.rate, value: rate, set: setRate, hint: dict.rateHint, max: 100 },
    { id: "tool-per-table", label: dict.perTable, value: perTable, set: setPerTable, hint: dict.perTableHint },
    { id: "tool-reserve", label: dict.reserve, value: reserve, set: setReserve, hint: dict.reserveHint },
  ];

  const results = [
    { label: dict.expected, value: expected },
    { label: dict.tables, value: tables, primary: true },
    { label: dict.seats, value: tables * seats },
    { label: dict.spare, value: spare },
  ];

  return (
    <div className="grid gap-8 rounded-2xl border border-border p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className={field.id === "tool-guests" ? "space-y-2 sm:col-span-2" : "space-y-2"}
          >
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              type="number"
              inputMode="numeric"
              min={0}
              max={field.max}
              value={field.value}
              onChange={(event) => field.set(event.target.value)}
              aria-describedby={field.hint ? `${field.id}-hint` : undefined}
            />
            {field.hint ? (
              <p id={`${field.id}-hint`} className="text-caption text-muted-foreground">
                {field.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div aria-live="polite" className="space-y-5 rounded-xl bg-muted p-6">
        <dl className="grid grid-cols-2 gap-5">
          {results.map((item) => (
            <div key={item.label}>
              <dt className="text-caption tracking-[0.12em] text-muted-foreground uppercase">
                {item.label}
              </dt>
              <dd
                className={
                  item.primary
                    ? "mt-1 font-editorial text-h2 font-medium tabular-nums text-(--gold-ink)"
                    : "mt-1 text-h4 font-medium tabular-nums"
                }
              >
                {item.value.toLocaleString("vi-VN")}
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-border pt-5 text-small text-muted-foreground">
          {dict.note}
        </p>
      </div>
    </div>
  );
}
