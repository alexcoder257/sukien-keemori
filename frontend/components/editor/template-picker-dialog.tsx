"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { TemplateMedia } from "@/components/template/template-media";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PhotoSlotKey, TemplateSlug } from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Mẫu thiệp ở dạng đã chuẩn bị sẵn cho client: trang editor là Server Component
 * nên nó rút gọn `WeddingTemplate` xuống đúng những gì trình chỉnh sửa cần và
 * serialize được.
 */
export type EditorTemplate = {
  slug: TemplateSlug;
  name: string;
  /** Ô ảnh mà thiết kế của mẫu dàn sẵn — xem `WeddingTemplate.photoSlots`. */
  photoSlots: PhotoSlotKey[];
  /** `position` chỉ có khi mẫu còn dùng chung ảnh atlas. */
  image: { src: string; position?: string };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: EditorTemplate[];
  /** Slug mẫu đang dùng — mẫu này được đánh dấu và không bấm lại được. */
  value: string;
  onSelect: (template: EditorTemplate) => void;
  dict: Dictionary["editor"]["templatePicker"];
};

/**
 * Đổi mẫu thiệp ngay trong trình chỉnh sửa. Chọn là đổi luôn — nội dung đã nhập
 * không phụ thuộc vào mẫu nên không có gì để xác nhận, và người dùng thấy ngay
 * kết quả ở khung xem thử.
 */
export function TemplatePickerDialog({
  open,
  onOpenChange,
  templates,
  value,
  onSelect,
  dict,
}: Props) {
  const [list, setList] = useState<HTMLUListElement | null>(null);
  const [readyPreviews, setReadyPreviews] = useState<Set<string>>(() => new Set());
  const visible = templates;

  useEffect(() => {
    if (!open || !list) return;

    // Native image lazy-loading can fetch several screens ahead. Keep the
    // picker to its visible rows plus one row before starting image requests.
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((entry) => entry.isIntersecting);
        if (entering.length === 0) return;
        setReadyPreviews((previous) => {
          const next = new Set(previous);
          for (const entry of entering) {
            next.add((entry.target as HTMLElement).dataset.templatePreview!);
          }
          return next;
        });
        for (const entry of entering) observer.unobserve(entry.target);
      },
      {
        root: list.closest('[data-slot="dialog-content"]'),
        rootMargin: "240px 0px",
      },
    );
    for (const preview of list.querySelectorAll("[data-template-preview]")) {
      observer.observe(preview);
    }
    return () => observer.disconnect();
  }, [open, list, templates]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Kho mẫu dài hơn màn hình. Vùng cuộn là chính popup chứ không phải một
          khung con: con lăn đặt ở đâu trong modal — kể cả trên tiêu đề hay dải
          padding — cũng cuộn được, không có vùng chết nào đẩy cuộn ra trang
          phía sau. `overscroll-contain` chặn nốt việc cuộn hết danh sách rồi
          lăn tiếp thì trang nền chạy theo. */}
      <DialogContent className="max-w-3xl overscroll-contain">
        <DialogHeader>
          <DialogTitle>{dict.title}</DialogTitle>
          <DialogDescription>{dict.description}</DialogDescription>
        </DialogHeader>

        <ul
          ref={setList}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {visible.map((template) => {
            const current = template.slug === value;
            return (
              <li key={template.slug}>
                <button
                  type="button"
                  aria-current={current ? "true" : undefined}
                  aria-label={fill(dict.select, { name: template.name })}
                  onClick={() => {
                    if (!current) onSelect(template);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "group w-full overflow-hidden rounded-xl text-left ring-1 transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    current
                      ? "ring-2 ring-primary"
                      : "ring-foreground/12 hover:ring-foreground/30",
                  )}
                >
                  {/* Khung dọc theo dáng một tấm thiệp thật, đủ để nhận ra mẫu
                      mà không cần mở trang xem thử. */}
                  <span
                    data-template-preview={template.slug}
                    className="relative block aspect-[3/4] overflow-hidden bg-foreground/5"
                  >
                    {readyPreviews.has(template.slug) ? (
                      <TemplateMedia
                        imageSrc={
                          template.image.position ? undefined : template.image.src
                        }
                        imagePosition={template.image.position ?? "0% 0%"}
                        alt=""
                        sizes="(max-width: 640px) 45vw, 200px"
                        scrim={false}
                      />
                    ) : null}
                    {current ? (
                      <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check aria-hidden className="size-3.5" />
                      </span>
                    ) : null}
                  </span>

                  <span className="flex min-w-0 items-center bg-card px-3 py-2">
                    <span className="min-w-0 truncate text-small font-medium">
                      {template.name}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
