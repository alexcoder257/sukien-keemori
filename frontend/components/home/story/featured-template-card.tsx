"use client";

import { PosterCard } from "@/components/shared/poster-card";
import { TemplateDetailDialogTrigger } from "@/components/template/template-detail-dialog";
import { TemplateTagBadges } from "@/components/template/template-tags";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/lib/format";
import type { WeddingTemplate } from "@/lib/data/templates";

type Props = {
  template: WeddingTemplate;
  dict: Dictionary["templates"];
  commonDict: Dictionary["common"];
  locale: Locale;
};

/**
 * Một tấm trong dải mẫu nổi bật ở trang chủ.
 *
 * Khung ảnh giữ đúng tỷ lệ `0.78` của card kho mẫu (xem `PosterCard`), nên
 * `poster.avif` và ảnh chụp dài `thumbnail.avif` dùng lại nguyên xi cho cả hai
 * màn — không có lát cắt thứ hai phải chụp riêng cho trang chủ.
 */
export function FeaturedTemplateCard({
  template,
  dict,
  commonDict,
  locale,
}: Props) {
  return (
    <PosterCard
      cursorLabel={commonDict.cursor.view}
      media={{
        imageSrc: template.imageSrc,
        imagePosition: template.imagePosition,
        alt: fill(dict.previewLabel, { name: template.name }),
        sizes: "(max-width: 640px) 70vw, 336px",
      }}
      overlay={<TemplateTagBadges tags={template.tags} dict={commonDict.tag} />}
      title={template.name}
      meta={template.categories
        .map((category) => dict.categories[category])
        .join(" · ")}
      // Cùng hành động với card ở kho mẫu: mở dialog chi tiết, không nhảy
      // thẳng vào editor.
      action={{
        render: () => (
          <TemplateDetailDialogTrigger
            template={template}
            dict={dict}
            commonDict={commonDict}
            locale={locale}
          />
        ),
      }}
    />
  );
}
