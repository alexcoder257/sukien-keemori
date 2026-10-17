"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PosterCard } from "@/components/shared/poster-card";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { WeddingTemplate } from "@/lib/data/templates";
import type { ReferenceInvitation } from "@/lib/data/reference-invitations";
import { fill } from "@/lib/format";
import { TemplateCard } from "./template-card";
import { TemplateDetailDialog } from "./template-detail-dialog";

type Props = {
  templates: WeddingTemplate[];
  referenceInvitations?: ReferenceInvitation[];
  dict: Dictionary["templates"];
  commonDict: Dictionary["common"];
  locale: Locale;
};

/**
 * Lưới mẫu tham khảo cho thiệp custom.
 *
 * Không có bộ lọc, ô tìm kiếm hay sắp xếp: site này bán thiệp thiết kế riêng,
 * nên trang mẫu chỉ là chỗ xem cảm hứng trước khi liên hệ — không phải kho
 * hàng trăm mẫu cần lọc theo gói, màu và phong cách như Keemori bản đầy đủ.
 * Lưới vì vậy trải hết bề ngang thay vì nhường 240px cho cột bộ lọc.
 */
export function TemplateGallery({
  templates,
  referenceInvitations = [],
  dict,
  commonDict,
  locale,
}: Props) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<WeddingTemplate | null>(null);
  // `HTMLElement` chứ không phải `HTMLButtonElement`: lớp phủ của card là thẻ
  // `<a>` để Googlebot đi được sang trang giới thiệu mẫu.
  const dialogTriggerRef = useRef<HTMLElement | null>(null);

  // Mẫu mới vào kho đứng trước. Các mẫu seed cùng một lượt trùng `createdAt`,
  // nên hoà thì `sortOrder` lớn hơn (thêm sau) đứng trước.
  const visible = useMemo(
    () =>
      [...templates].sort(
        (a, b) =>
          Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
          b.sortOrder - a.sortOrder,
      ),
    [templates],
  );

  const openTemplate = useCallback(
    (template: WeddingTemplate, trigger: HTMLElement) => {
      dialogTriggerRef.current = trigger;
      setSelectedTemplate(template);
    },
    [],
  );

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (open) return;
    setSelectedTemplate(null);
    requestAnimationFrame(() => dialogTriggerRef.current?.focus());
  }, []);

  return (
    <div className="container-page py-16 max-mobile:pt-6 max-mobile:pb-12">
      {visible.length === 0 && referenceInvitations.length === 0 ? (
        // Kho trống không phải ngõ cụt: thiệp custom không cần chọn mẫu nào,
        // nên lối đi tiếp luôn là liên hệ tư vấn.
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-body text-pretty text-muted-foreground">
            {dict.emptyCatalog}
          </p>
          <Link
            href={`/${locale}/lien-he`}
            className={buttonVariants({ variant: "default" })}
          >
            {dict.contactCta}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 max-mobile:grid-cols-2 max-mobile:gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {referenceInvitations.map((invitation, index) => (
            <PosterCard
              key={invitation.slug}
              variant="surface"
              cursor="card"
              cursorLabel={commonDict.cursor.view}
              title={invitation.name}
              titleClassName="text-body-lg leading-snug max-mobile:text-small"
              meta={invitation.description}
              media={{
                imageSrc: invitation.imageSrc,
                posterSrc: invitation.posterSrc,
                imagePosition: "50% 0%",
                alt: fill(dict.previewLabel, { name: invitation.name }),
                sizes: "(max-width: 440px) 48vw, (max-width: 640px) 90vw, (max-width: 1024px) 42vw, 384px",
                eager: index === 0,
              }}
              action={{ href: invitation.href }}
            />
          ))}
          {visible.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              dict={dict}
              commonDict={commonDict}
              locale={locale}
              eagerImage={referenceInvitations.length === 0 && index === 0}
              onOpen={openTemplate}
            />
          ))}
        </div>
      )}

      {selectedTemplate ? (
        <TemplateDetailDialog
          open
          onOpenChange={handleDialogOpenChange}
          template={selectedTemplate}
          dict={dict}
          commonDict={commonDict}
          locale={locale}
        />
      ) : null}
    </div>
  );
}
