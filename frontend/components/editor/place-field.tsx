"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Loader2, MapPin } from "lucide-react";
import { getPlaceDetails, type PlaceSuggestion } from "@/apis";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PLACE_QUERY_MIN_LENGTH,
  usePlaceSuggestionsQuery,
} from "@/hooks/use-places";
import type { Dictionary } from "@/i18n/dictionaries";
import { FieldLabel, editorFieldSurface } from "./editor-field";

/** Toạ độ đi kèm ô địa chỉ; `null` khi người dùng tự gõ. */
export type PlaceRef = {
  placeId: string;
  latitude: number;
  longitude: number;
} | null;

/** Một gợi ý lấy từ chính dữ liệu người dùng đã nhập trong thiệp. */
export type LocalSuggestion = {
  /** Nhãn ngắn cho biết địa chỉ này lấy từ đâu: "Nhà trai", "Nhà gái"… */
  label: string;
  value: string;
};

type Props = {
  label: string;
  placeholder?: string;
  error?: string;
  className?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** Gọi kèm mỗi lần `onChange` — xem chú thích về toạ độ mồ côi bên dưới. */
  onPlaceChange: (place: PlaceRef) => void;
  /**
   * Địa chỉ đã nhập ở block khác trong cùng thiệp. Đây là nguồn gợi ý **chính**
   * và không tốn gì: lễ thành hôn gần như luôn ở địa chỉ nhà trai, lễ vu quy ở
   * nhà gái, nên phần lớn lượt nhập chỉ là chép lại một dòng đã có.
   */
  localSuggestions?: LocalSuggestion[];
  dict: Dictionary["editor"]["places"];
};

/** So khớp không phân biệt hoa thường và **không phân biệt dấu**: người dùng gõ
 * "nha trai" phải ra "Nhà trai". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/** Ghép tên địa điểm với địa chỉ, bỏ phần lặp khi tên đã nằm trong địa chỉ. */
function composeAddress(name: string, address: string): string {
  if (!name) return address;
  if (!address) return name;
  return address.startsWith(name) ? address : `${name}, ${address}`;
}

/**
 * Ô "Địa điểm" có gợi ý từ Google Places (đi qua backend của mình, xem
 * `apis/places.ts`).
 *
 * Ô vẫn là **text tự do**: rất nhiều lễ diễn ra ở "Nhà gái, thôn 3, xã X" —
 * chỗ không có trên bản đồ — nên bắt buộc chọn từ danh sách là chặn mất phần
 * lớn đám cưới ở quê. Gợi ý chỉ là trợ giúp gõ nhanh.
 *
 * Hai quy tắc giữ dữ liệu khỏi nói dối:
 *
 * 1. Gõ tay một ký tự là **xoá toạ độ** đã chọn trước đó. Giữ lại thì bản đồ
 *    trỏ vào một nơi mà chữ trên thiệp không hề nhắc tới.
 * 2. `sessionToken` sống suốt một phiên gõ rồi đổi sau khi chọn xong. Google
 *    tính cả chuỗi gõ + lần lấy chi tiết cuối là một session; token cố định
 *    vĩnh viễn hay đổi mỗi phím đều làm hoá đơn sai lệch.
 */
export function EditorPlaceField({
  label,
  placeholder,
  error,
  className,
  required,
  value,
  onChange,
  onPlaceChange,
  localSuggestions = [],
  dict,
}: Props) {
  const id = useId();
  const listId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resolving, setResolving] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());
  // Ngăn `onBlur` đóng danh sách trước khi cú click vào một dòng kịp chạy.
  const selectingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * Vị trí ô nhập, đo ở client. Còn `null` cho tới khi đo xong, nên portal
   * không bao giờ chạy lúc render trên server — khỏi cần cờ `mounted`.
   */
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const { data: suggestions = [], isFetching } = usePlaceSuggestionsQuery(
    open ? value : "",
    sessionToken,
  );
  const query = value.trim();
  const matchedLocal = localSuggestions.filter(
    (item) =>
      item.value &&
      (!query || normalize(item.value).includes(normalize(query))),
  );
  // Gợi ý nội bộ hiện ngay khi ô còn trống — đó là lúc nó hữu ích nhất. Danh
  // sách từ Google chỉ mở khi truy vấn đủ dài, vì mỗi lượt gọi đều tính tiền.
  const showRemote = query.length >= PLACE_QUERY_MIN_LENGTH;
  const showList = open && (matchedLocal.length > 0 || showRemote);

  // Thẻ block của editor dùng `overflow-hidden` (bo góc), nên một danh sách
  // `position: absolute` nằm trong đó bị **cắt mất** — nó vẫn render nhưng
  // không ai nhìn thấy. Vì vậy dropdown đi qua portal ra `body` và tự định vị
  // theo ô nhập bằng `position: fixed`.
  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        setAnchor({ top: rect.bottom, left: rect.left, width: rect.width });
      }
    };
    measure();

    // Cuộn trong panel editor chứ không chỉ trên window, nên bắt ở giai đoạn
    // capture để nghe được mọi vùng cuộn cha.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, value]);

  function handleType(next: string) {
    onChange(next);
    // Quy tắc 1: chữ đổi thì toạ độ cũ không còn mô tả chỗ nào cả.
    onPlaceChange(null);
    setOpen(true);
    setActiveIndex(-1);
  }

  async function handleSelect(suggestion: PlaceSuggestion) {
    setOpen(false);
    setActiveIndex(-1);
    // Đặt trước phần chữ lấy từ chính gợi ý: nếu bước lấy chi tiết hỏng thì
    // người dùng vẫn có địa chỉ đã chọn, chỉ thiếu toạ độ.
    onChange(composeAddress(suggestion.mainText, suggestion.secondaryText));
    onPlaceChange(null);

    // Nguồn mở trả toạ độ ngay trong gợi ý; chỉ Google mới bắt gọi thêm một
    // lượt `details` (và tính tiền lượt đó).
    if (
      suggestion.latitude !== undefined &&
      suggestion.longitude !== undefined
    ) {
      onPlaceChange({
        placeId: suggestion.placeId,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
      setSessionToken(crypto.randomUUID());
      return;
    }

    setResolving(true);
    try {
      const details = await getPlaceDetails(suggestion.placeId, sessionToken);
      onChange(composeAddress(details.name, details.address));
      onPlaceChange({
        placeId: details.placeId,
        latitude: details.latitude,
        longitude: details.longitude,
      });
    } catch {
      // Im lặng: gợi ý là tiện ích, hỏng thì ô nhập vẫn dùng bình thường.
    } finally {
      setResolving(false);
      // Quy tắc 2: phiên tính tiền khép lại ở đây, lần gõ sau là phiên mới.
      setSessionToken(crypto.randomUUID());
    }
  }

  function handleSelectLocal(item: LocalSuggestion) {
    setOpen(false);
    setActiveIndex(-1);
    onChange(item.value);
    // Địa chỉ chép từ block khác là chuỗi chữ thuần, chưa có toạ độ nào.
    onPlaceChange(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const count = matchedLocal.length + suggestions.length;
      if (count === 0) return;
      setActiveIndex((current) => (current + delta + count) % count);
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const local = matchedLocal[activeIndex];
      if (local) {
        handleSelectLocal(local);
        return;
      }
      const remote = suggestions[activeIndex - matchedLocal.length];
      if (remote) void handleSelect(remote);
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
        <FieldLabel label={label} required={required} />
      </Label>
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          aria-required={required || undefined}
          className={`${editorFieldSurface} pr-10`}
          placeholder={placeholder}
          aria-invalid={!!error}
          value={value}
          onChange={(event) => handleType(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (selectingRef.current) return;
            setOpen(false);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        {isFetching || resolving ? (
          <Loader2
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : null}

        {showList && anchor
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
                {matchedLocal.map((item, index) => (
                  <li key={`local-${item.label}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={() => {
                        selectingRef.current = true;
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        selectingRef.current = false;
                        handleSelectLocal(item);
                      }}
                      className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                        index === activeIndex ? "bg-accent" : ""
                      }`}
                    >
                      <Copy
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-small font-medium">
                          {item.value}
                        </span>
                        <span className="block truncate text-caption text-muted-foreground">
                          {item.label}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}

                {showRemote && suggestions.length === 0 ? (
                  <li className="px-3 py-2 text-small text-muted-foreground">
                    {isFetching ? dict.searching : dict.empty}
                  </li>
                ) : (
                  suggestions.map((suggestion, index) => {
                    const position = matchedLocal.length + index;
                    return (
                      <li key={suggestion.placeId}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={position === activeIndex}
                          // `mousedown` chạy trước `blur`, nên cắm cờ ở đây mới kịp
                          // giữ danh sách sống tới lúc `click` chạy.
                          onMouseDown={() => {
                            selectingRef.current = true;
                          }}
                          onMouseEnter={() => setActiveIndex(position)}
                          onClick={() => {
                            selectingRef.current = false;
                            void handleSelect(suggestion);
                          }}
                          className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                            position === activeIndex ? "bg-accent" : ""
                          }`}
                        >
                          <MapPin
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-small font-medium">
                              {suggestion.mainText}
                            </span>
                            {suggestion.secondaryText ? (
                              <span className="block truncate text-caption text-muted-foreground">
                                {suggestion.secondaryText}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}

                {showRemote && suggestions.length > 0 ? (
                  <li className="px-3 pt-1.5 pb-1 text-caption text-muted-foreground">
                    {dict.attribution}
                  </li>
                ) : null}
              </ul>,
              document.body,
            )
          : null}
      </div>
      {error ? (
        <p className="mt-2 text-caption text-destructive">{error}</p>
      ) : showList && showRemote ? (
        <p className="mt-2 text-caption text-muted-foreground">{dict.hint}</p>
      ) : null}
    </div>
  );
}
