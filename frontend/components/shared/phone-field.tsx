"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PHONE_COUNTRIES,
  countryFlagEmoji,
  findPhoneCountry,
  type PhoneCountry,
} from "@/constants";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  /** Nhãn và placeholder riêng của form đang dùng ô này. */
  label: string;
  placeholder: string;
  /** Chuỗi của ô chọn mã vùng — dùng chung, lấy từ `dict.common.phoneField`. */
  countryDict: Dictionary["common"]["phoneField"];
  /** Mã ISO của quốc gia đang chọn. */
  country: string;
  onCountryChange: (iso: string) => void;
  /** Phần số nội địa, người dùng gõ thô (có thể kèm khoảng trắng). */
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
};

interface CountryOption extends PhoneCountry {
  name: string;
  flag: string;
}

export function PhoneField({
  locale,
  label,
  placeholder,
  countryDict,
  country,
  onCountryChange,
  value,
  onValueChange,
  onBlur,
  error,
  disabled,
}: Props) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Tên nước lấy từ Intl theo locale đang xem, nên không cần dịch tay 130 dòng.
  const options = useMemo<CountryOption[]>(() => {
    const display = new Intl.DisplayNames([locale], { type: "region" });
    const collator = new Intl.Collator(locale);
    const [first, ...rest] = PHONE_COUNTRIES.map((item) => ({
      ...item,
      name: display.of(item.iso) ?? item.iso,
      flag: countryFlagEmoji(item.iso),
    }));
    rest.sort((a, b) => collator.compare(a.name, b.name));
    return [first, ...rest];
  }, [locale]);

  const selected = useMemo(
    () =>
      options.find((item) => item.iso === country) ??
      options[0] ?? {
        ...findPhoneCountry(country),
        name: country,
        flag: countryFlagEmoji(country),
      },
    [options, country],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^\+/, "");
    if (!needle) return options;
    return options.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.iso.toLowerCase().includes(needle) ||
        item.dial.startsWith(needle),
    );
  }, [options, query]);

  function selectCountry(iso: string) {
    onCountryChange(iso);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Không có dấu sao đỏ — đó là cách trường này nói "không bắt buộc". */}
      <Label htmlFor={fieldId}>{label}</Label>

      <div
        className={cn(
          "flex h-11 w-full items-stretch rounded-lg border border-input transition-colors",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
          error &&
            "border-destructive focus-within:border-destructive focus-within:ring-destructive/25",
          disabled && "pointer-events-none opacity-40",
        )}
      >
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setQuery("");
          }}
        >
          <PopoverTrigger
            type="button"
            disabled={disabled}
            aria-label={`${countryDict.countryLabel}: ${selected.name} +${selected.dial}`}
            className="flex shrink-0 items-center gap-1.5 rounded-l-lg px-3 text-body text-foreground outline-none hover:bg-foreground/5 focus-visible:bg-foreground/5"
          >
            <span aria-hidden className="text-[18px] leading-none">
              {selected.flag}
            </span>
            <span className="tabular-nums">+{selected.dial}</span>
            <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
          </PopoverTrigger>

          <PopoverContent align="start" className="w-[min(20rem,90vw)] gap-2">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground"
              />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={countryDict.countrySearch}
                aria-label={countryDict.countrySearch}
                className="h-9 pl-9 text-small"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-small text-muted-foreground">
                {countryDict.countryEmpty}
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {filtered.map((item) => {
                  const active = item.iso === selected.iso;
                  return (
                    <li key={item.iso}>
                      <button
                        type="button"
                        onClick={() => selectCountry(item.iso)}
                        aria-current={active || undefined}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-small outline-none",
                          "hover:bg-foreground/5 focus-visible:bg-foreground/5",
                          active && "bg-foreground/5",
                        )}
                      >
                        <span aria-hidden className="text-[18px] leading-none">
                          {item.flag}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.name}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          +{item.dial}
                        </span>
                        {active ? (
                          <Check aria-hidden className="size-4 text-primary" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </PopoverContent>
        </Popover>

        <span aria-hidden className="my-2 w-px bg-input" />

        <Input
          id={fieldId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full rounded-none rounded-r-lg border-0 pl-3 focus-visible:ring-0 not-placeholder-shown:border-0"
        />
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
