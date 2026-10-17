"use client";

import { ChevronDown, Info } from "lucide-react";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { fill } from "@/lib/format";

/**
 * Một thẻ nội dung trong editor: fold/unfold độc lập, công tắc bên phải bật
 * hoặc tắt việc hiển thị block đó trên thiệp.
 *
 * Bỏ `onVisibleChange` thì thẻ không có công tắc — dành cho phần nội dung mà
 * mẫu bắt buộc phải có, ví dụ ô ảnh trong thiết kế: tắt đi thì bố cục mẫu thủng
 * một mảng, nên nó không phải thứ bật/tắt được.
 */
export function EditorBlock({
  title,
  visible,
  onVisibleChange,
  toggleLabel,
  defaultOpen = true,
  children,
}: {
  title: string;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  /** Mẫu câu chứa `{name}` cho aria-label của công tắc. */
  toggleLabel: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/15"
    >
      <div className="flex items-center gap-4 border-b border-foreground/15 bg-foreground/4 px-6 py-4 max-mobile:gap-3 max-mobile:px-4">
        <CollapsibleTrigger>
          <ChevronDown aria-hidden />
          <span className="font-heading text-body-lg leading-snug font-medium max-mobile:text-body">{title}</span>
        </CollapsibleTrigger>
        {onVisibleChange ? (
          <Switch
            checked={visible}
            onCheckedChange={onVisibleChange}
            aria-label={fill(toggleLabel, { name: title })}
          />
        ) : null}
      </div>
      <CollapsiblePanel>
        <div className="flex flex-col gap-6 p-6">{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

/** Ghi chú giải thích quy tắc nghiệp vụ ngay trong block. */
export function EditorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl border border-foreground/12 bg-foreground/5 px-4 py-3 text-small text-muted-foreground">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  );
}
