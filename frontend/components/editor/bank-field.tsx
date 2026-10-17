"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Landmark, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BANKS, findBankByBin, type Bank } from "@/constants/banks";
import type { Dictionary } from "@/i18n/dictionaries";
import { FieldLabel, editorFieldSurface } from "./editor-field";

type Props = {
  label: string;
  placeholder?: string;
  error?: string;
  className?: string;
  /** BIN 6 số đang chọn, rỗng khi chưa chọn. */
  value: string;
  onChange: (bin: string) => void;
  dict: Dictionary["editor"]["banks"];
};

/** Gõ "vietcom", "vcb" hay "ngoai thuong" đều phải ra Vietcombank. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function matches(bank: Bank, query: string): boolean {
  const needle = normalize(query);
  return (
    normalize(bank.shortName).includes(needle) ||
    normalize(bank.code).includes(needle) ||
    normalize(bank.name).includes(needle) ||
    bank.bin.includes(needle)
  );
}

/**
 * Chọn ngân hàng cho khối "Hộp mừng cưới".
 *
 * **Là select chứ không phải ô chữ tự do**, dù trông giống ô nhập: giá trị lưu
 * xuống là BIN 6 số của NAPAS — thứ duy nhất sinh được QR VietQR. Người dùng gõ
 * "VCB" hay "vietcom bank" vào một ô text thì không có cách nào suy ra BIN, và
 * hậu quả là mã QR câm lặng không hiện ra.
 *
 * Danh sách nằm sẵn trong `constants/banks.ts` nên không gọi mạng, không có
 * trạng thái chờ; ô nhập ở đây chỉ để lọc 42 dòng.
 *
 * Dropdown đi qua portal vì thẻ block của editor `overflow-hidden` sẽ cắt mất
 * danh sách — cùng lý do với `EditorPlaceField`.
 */
export function EditorBankField({
  label,
  placeholder,
  error,
  className,
  value,
  onChange,
  dict,
}: Props) {
  const id = useId();
  const listId = `${id}-listbox`;
  const selected = findBankByBin(value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  /**
   * Ô hiện tên ngân hàng đã chọn khi đóng, và hiện đúng thứ người dùng đang gõ
   * khi mở. Nếu để chung một state thì mở dropdown ra là mất tên đã chọn.
   */
  const text = open ? query : (selected?.shortName ?? "");
  const results = query.trim()
    ? BANKS.filter((bank) => matches(bank, query.trim()))
    : BANKS;

  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        setAnchor({ top: rect.bottom, left: rect.left, width: rect.width });
      }
    };
    measure();

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, query]);

  function handleSelect(bank: Bank) {
    onChange(bank.bin);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (current) => (current + delta + results.length) % results.length,
      );
      return;
    }
    if (event.key === "Enter") {
      // Chỉ chặn Enter khi đang thật sự chọn trong danh sách; nếu không thì phím
      // này vẫn phải submit form như mọi ô khác trong editor.
      const bank = results[activeIndex];
      if (bank) {
        event.preventDefault();
        handleSelect(bank);
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2">
        <FieldLabel label={label} />
      </Label>
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          className={`${editorFieldSurface} pr-10`}
          placeholder={placeholder}
          aria-invalid={!!error}
          value={text}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onBlur={() => {
            if (selectingRef.current) return;
            setOpen(false);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />

        {selected && !open ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label={dict.clear}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <Landmark
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        )}

        {open && anchor
          ? createPortal(
              <ul
                id={listId}
                role="listbox"
                style={{
                  position: "fixed",
                  top: anchor.top + 4,
                  left: anchor.left,
                  width: anchor.width,
                }}
                className="z-50 max-h-64 overflow-auto rounded-lg border border-input bg-popover p-1 shadow-lg"
              >
                {results.length === 0 ? (
                  <li className="px-3 py-2 text-small text-muted-foreground">
                    {dict.empty}
                  </li>
                ) : (
                  results.map((bank, index) => (
                    <li key={bank.bin}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={bank.bin === value}
                        onMouseDown={() => {
                          selectingRef.current = true;
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          selectingRef.current = false;
                          handleSelect(bank);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors ${
                          index === activeIndex ? "bg-accent" : ""
                        }`}
                      >
                        <BankLogo bank={bank} />
                        <span className="min-w-0">
                          <span className="block truncate text-small font-medium">
                            {bank.shortName}
                          </span>
                          <span className="block truncate text-caption text-muted-foreground">
                            {bank.name}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>,
              document.body,
            )
          : null}
      </div>
      {error ? (
        <p className="mt-2 text-caption text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

/**
 * Vài ngân hàng không có file logo (xem `constants/banks.ts`), nên ô ảnh phải
 * chịu được chỗ trống — dựng khung xám với chữ cái đầu thay vì để ảnh vỡ.
 */
function BankLogo({ bank }: { bank: Bank }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-caption font-medium text-muted-foreground"
      >
        {bank.shortName.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={`/images/banks/${bank.code}.avif`}
      alt=""
      width={32}
      height={32}
      className="size-8 shrink-0 rounded-md object-contain"
      onError={() => setFailed(true)}
    />
  );
}
