"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DRESS_CODE_SUGGESTED_COLORS } from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import {
  DRESS_CODE_MAX_COLORS,
  isHexColor,
  normalizeHexColor,
  type InvitationContent,
} from "@/lib/schemas/invitation";
import { cn } from "@/lib/utils";
import {
  EditorField,
  EditorTextareaField,
  editorFieldSurface,
} from "./editor-field";
import { EditorNote } from "./editor-block";

type Props = {
  form: UseFormReturn<InvitationContent>;
  dict: Dictionary["editor"];
};

/**
 * Dress code là gợi ý trang phục cho khách: tiêu đề, mô tả và một bảng tông
 * màu. Màu chọn theo ba đường — bấm vào ô gợi ý, dán mã hex, hoặc mở bộ chọn
 * màu của trình duyệt — nhưng cùng đổ về một danh sách duy nhất phía trên để
 * người dùng luôn nhìn thấy bảng màu thật của mình.
 */
export function DressCodeFields({ form, dict }: Props) {
  const t = dict.blocks.dressCode;
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");
  const colors = form.watch("dressCode.colors");
  const full = colors.length >= DRESS_CODE_MAX_COLORS;
  const draftColor = normalizeHexColor(draft);

  const setColors = (next: string[]) =>
    form.setValue("dressCode.colors", next, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });

  // Cùng một màu hai lần không nói thêm điều gì, nên chọn lại là bỏ chọn.
  const toggleColor = (color: string) => {
    if (colors.includes(color)) {
      setColors(colors.filter((current) => current !== color));
      return;
    }
    if (!full) setColors([...colors, color]);
  };

  const addDraft = () => {
    const color = normalizeHexColor(draft);
    if (!isHexColor(color)) {
      setDraftError(t.colorInvalid);
      return;
    }
    setDraftError("");
    setDraft("");
    if (!colors.includes(color)) setColors([...colors, color]);
  };

  return (
    <>
      <EditorField
        label={t.heading}
        placeholder={t.headingPlaceholder}
        registration={form.register("dressCode.title")}
      />
      <EditorTextareaField
        label={t.description}
        placeholder={t.descriptionPlaceholder}
        rows={3}
        registration={form.register("dressCode.description")}
      />

      <div>
        <Label className="mb-2">{t.colors}</Label>
        {/* Bảng màu đang chọn: bấm vào một ô là bỏ nó ra, nên không cần thêm
            nút xoá bên cạnh từng ô. */}
        <div className="flex flex-wrap items-center gap-3">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              aria-label={fill(t.removeColor, { color })}
              title={color}
              className="group relative size-11 rounded-full ring-1 ring-foreground/20 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              style={{ background: color }}
            >
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-forest-ink/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <X aria-hidden className="size-4 text-ivory" />
              </span>
            </button>
          ))}

          {!full ? (
            // Ô "+" nét đứt mở thẳng bộ chọn màu của trình duyệt cho người
            // không có sẵn mã hex trong tay.
            <label
              className={cn(
                "flex size-11 cursor-pointer items-center justify-center rounded-full border border-dashed border-foreground/35 text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground",
                "focus-within:ring-2 focus-within:ring-ring",
              )}
            >
              <Plus aria-hidden className="size-4" />
              <span className="sr-only">{t.pickColor}</span>
              <input
                type="color"
                // Bộ chọn màu luôn mở từ một màu trung tính: nó không phải một
                // ô màu đang có giá trị, chỉ là cửa vào.
                value="#ffffff"
                onChange={(event) => toggleColor(event.target.value)}
                className="sr-only"
              />
            </label>
          ) : null}
        </div>

        <p className="mt-2 text-caption text-muted-foreground">
          {fill(t.colorLimit, { limit: DRESS_CODE_MAX_COLORS })}
        </p>
      </div>

      <div>
        <Label className="mb-2 text-muted-foreground">
          {t.suggestedColors}
        </Label>
        <div className="flex flex-wrap gap-3">
          {DRESS_CODE_SUGGESTED_COLORS.map((color) => {
            const selected = colors.includes(color);
            return (
              <button
                key={color}
                type="button"
                onClick={() => toggleColor(color)}
                disabled={full && !selected}
                aria-pressed={selected}
                aria-label={fill(selected ? t.removeColor : t.addColorLabel, {
                  color,
                })}
                title={color}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full ring-1 ring-foreground/15 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  selected &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-card",
                  full &&
                    !selected &&
                    "cursor-not-allowed opacity-40 hover:scale-100",
                )}
                style={{ background: color }}
              >
                {selected ? (
                  // Dấu tích chìm/nổi theo độ sáng của chính ô màu, nếu không
                  // nó biến mất trên nền trắng ngà hoặc nền đen.
                  <Check
                    aria-hidden
                    className={cn(
                      "size-4",
                      isLightColor(color) ? "text-forest-ink" : "text-ivory",
                    )}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="mb-2 text-muted-foreground">{t.customColor}</Label>
        <div className="flex items-center gap-3">
          {/* Ô xem trước đứng ngay cạnh mã: gõ tới ký tự thứ sáu là thấy ngay
              màu mình vừa dán, chưa cần bấm Thêm. Bấm vào nó thì mở bộ chọn màu
              của trình duyệt và màu chọn được điền ngược lại vào ô mã — vẫn phải
              bấm Thêm, để hai đường nhập cùng kết thúc ở một chỗ. */}
          <label
            className={cn(
              "relative size-11 shrink-0 overflow-hidden rounded-full ring-1 ring-foreground/20 focus-within:ring-2 focus-within:ring-ring",
              full ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
            style={{
              background: isHexColor(draftColor)
                ? draftColor
                : "repeating-conic-gradient(color-mix(in oklab, var(--color-forest-ink) 12%, transparent) 0% 25%, transparent 0% 50%) 0 0 / 12px 12px",
            }}
          >
            <span className="sr-only">{t.pickColor}</span>
            <input
              type="color"
              value={isHexColor(draftColor) ? draftColor : "#ffffff"}
              disabled={full}
              onChange={(event) => {
                setDraft(event.target.value);
                setDraftError("");
              }}
              className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
          </label>
          <Input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setDraftError("");
            }}
            onKeyDown={(event) => {
              // Enter trong form này mặc định là submit; ở đây nó phải nghĩa là
              // "thêm màu".
              if (event.key !== "Enter") return;
              event.preventDefault();
              addDraft();
            }}
            placeholder={t.colorPlaceholder}
            aria-label={t.customColor}
            aria-invalid={!!draftError}
            disabled={full}
            className={`${editorFieldSurface} font-mono`}
          />
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            disabled={full || !draft.trim()}
            onClick={addDraft}
          >
            <Plus />
            {t.addColor}
          </Button>
        </div>
        {draftError ? (
          <p className="mt-2 text-caption text-destructive">{draftError}</p>
        ) : null}
      </div>

      <EditorNote>{dict.notes.dressCode}</EditorNote>
    </>
  );
}

/**
 * Độ sáng cảm nhận theo hệ số của sRGB (BT.601) — đủ để quyết định dấu tích nên
 * là mực hay ngà, không cần tới phép tính tương phản đầy đủ.
 */
function isLightColor(hex: string) {
  const value = normalizeHexColor(hex).slice(1);
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
