"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GREETING_OCCASIONS,
  KIND_OCCASION_FIELDS,
  type GreetingOccasion,
  type InvitationKind,
  type OccasionField,
} from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { EditorNote } from "./editor-block";
import {
  EditorField,
  EditorTextareaField,
  editorFieldSurface,
} from "./editor-field";

type FieldCopy = { label: string; placeholder: string };

/**
 * Khối "Thông tin chính" của các loại khác thiệp cưới — người được mừng, tên
 * sự kiện, người nhận lời chúc… Trường nào hiện và chữ của nó là gì đều theo
 * loại (`KIND_OCCASION_FIELDS`, `editor.occasion.<loại>`). Không có công tắc:
 * đây là thứ thiệp mở đầu bằng, giống ô tên cô dâu chú rể của thiệp cưới.
 */
export function OccasionFields({
  form,
  kind,
  dict,
}: {
  form: UseFormReturn<InvitationContent>;
  kind: Exclude<InvitationKind, "wedding">;
  dict: Dictionary["editor"]["occasion"];
}) {
  const copy = dict[kind].fields as Partial<Record<OccasionField, FieldCopy>>;
  const errors = form.formState.errors.occasion;

  const field = (name: OccasionField) => {
    const text = copy[name] ?? { label: name, placeholder: "" };
    if (name === "greetingOccasion") {
      return (
        <div key={name}>
          <Label className="mb-2">{text.label}</Label>
          <Controller
            control={form.control}
            name="occasion.greetingOccasion"
            render={({ field: occasionField }) => (
              <Select
                value={occasionField.value}
                onValueChange={(value) => occasionField.onChange(value)}
              >
                <SelectTrigger className={editorFieldSurface}>
                  {/* Không có children thì Base UI hiện thẳng key (`opening`)
                      thay vì nhãn đã dịch. */}
                  <SelectValue>
                    {(value: GreetingOccasion) => dict.greetingOccasions[value]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GREETING_OCCASIONS.map((occasion) => (
                    <SelectItem key={occasion} value={occasion}>
                      {dict.greetingOccasions[occasion]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      );
    }
    if (name === "message") {
      return (
        <EditorTextareaField
          key={name}
          label={text.label}
          placeholder={text.placeholder}
          rows={4}
          error={errors?.message?.message}
          registration={form.register("occasion.message")}
        />
      );
    }
    return (
      <EditorField
        key={name}
        label={text.label}
        placeholder={text.placeholder}
        required={name === "name"}
        error={errors?.[name]?.message}
        registration={form.register(`occasion.${name}`)}
      />
    );
  };

  return (
    <>
      {KIND_OCCASION_FIELDS[kind].map(field)}
      <EditorNote>{dict.hint}</EditorNote>
    </>
  );
}
