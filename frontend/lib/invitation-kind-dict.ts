import type { InvitationKind } from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Trộn sâu `override` lên `base`. Mảng (gợi ý lời chúc) bị **thay** chứ không
 * nối — một bộ gợi ý cho thiệp sinh nhật không được lẫn câu "đầu bạc răng long".
 */
function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override ?? base) as T;
  }
  const merged: PlainObject = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = deepMerge(base[key], value);
  }
  return merged as T;
}

/**
 * Chữ của thiệp (`invitation.sections`) theo loại. Từ điển gốc là chữ của
 * thiệp cưới; các loại khác phủ lên bằng `kindSections.common` rồi
 * `kindSections.<loại>`. Trộn ở **điểm vào chung** của renderer
 * (`templates/registry.ts`) nên mẫu nào cũng nhận đúng chữ mà không phải biết
 * loại thiệp.
 */
export function invitationDictForKind(
  dict: Dictionary["invitation"],
  kind: InvitationKind,
): Dictionary["invitation"] {
  if (kind === "wedding") return dict;
  const sections = deepMerge(
    deepMerge(dict.sections, dict.kindSections.common),
    dict.kindSections[kind],
  );
  return { ...dict, sections };
}

/**
 * Nhãn và ghi chú của editor (`editor.blocks`, `editor.notes`) theo loại — cùng cách trộn với
 * `invitationDictForKind`. Các component trường (`ReceptionFields`…) chỉ đọc
 * `dict.blocks`, nên chúng tự ra chữ đúng loại mà không cần biết loại thiệp.
 */
export function editorDictForKind(
  dict: Dictionary["editor"],
  kind: InvitationKind,
): Dictionary["editor"] {
  if (kind === "wedding") return dict;
  const blocks = deepMerge(
    deepMerge(dict.blocks, dict.kindBlocks.common),
    dict.kindBlocks[kind],
  );
  const notes = deepMerge(dict.notes, dict.kindNotes.common);
  return { ...dict, blocks, notes };
}
