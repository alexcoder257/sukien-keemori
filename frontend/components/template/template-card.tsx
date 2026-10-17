"use client";

import { memo } from "react";
import { PosterCard } from "@/components/shared/poster-card";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/lib/format";
import type { WeddingTemplate } from "@/lib/data/templates";
import { TemplateTagBadges } from "./template-tags";

type Props = {
  template: WeddingTemplate;
  dict: Dictionary["templates"];
  commonDict: Dictionary["common"];
  locale: Locale;
  eagerImage?: boolean;
  /** Lớp phủ là thẻ `<a>`, nên trigger không còn chắc chắn là `<button>`. */
  onOpen: (template: WeddingTemplate, trigger: HTMLElement) => void;
};

/**
 * Card mẫu thiệp ở trang mẫu tham khảo: preview, nhãn hot/new và lối vào
 * dialog chi tiết. Khung và ảnh dùng chung `PosterCard` với trang chủ. Không
 * còn nhãn gói Free/Gold/Diamond: thiệp custom không bán theo gói.
 */
export const TemplateCard = memo(function TemplateCard({
  template,
  dict,
  commonDict,
  locale,
  eagerImage = false,
  onOpen,
}: Props) {
  return (
    <PosterCard
      variant="surface"
      tier={template.tier}
      cursor="card"
      // Cả card là lối vào xem trước mẫu thiệp nên con trỏ nói thẳng "Xem".
      cursorLabel={commonDict.cursor.view}
      media={{
        imageSrc: template.imageSrc,
        imagePosition: template.imagePosition,
        alt: fill(dict.previewLabel, { name: template.name }),
        sizes:
          "(max-width: 440px) 48vw, (max-width: 640px) 90vw, (max-width: 1024px) 42vw, 560px",
        eager: eagerImage,
      }}
      overlay={<TemplateTagBadges tags={template.tags} dict={commonDict.tag} />}
      title={template.name}
      // Dưới 440px kho mẫu chia hai cột, card chỉ còn ~180px nên tên nhỏ lại.
      titleClassName="text-body-lg leading-snug max-mobile:text-small"
      meta={template.categories
        .map((category) => dict.categories[category])
        .join(" · ")}
      action={{
        // Các link bên trong dialog vẫn bấm được vì dialog render trong portal.
        render: (resetPreview) => (
          /**
           * Lớp phủ là **link thật**, không phải `<button>`.
           *
           * Trang giới thiệu của mẫu (`/mau-thiep/<slug>`) chỉ được trỏ tới từ
           * khối "mẫu tương tự" nằm trên chính các trang đó — một cụm khép kín.
           * Không có `href` ở kho mẫu thì cả 63 trang là **trang mồ côi**:
           * Google chỉ tìm ra qua sitemap và không có luồng thẩm quyền nào chảy
           * từ `/mau-thiep` xuống. Thẻ `<a>` ở đây là đường đi đó.
           *
           * Hành vi cho người dùng **không đổi**: click thường vẫn mở dialog.
           * Chỉ Ctrl/Cmd/Shift/chuột giữa mới đi theo `href` — đúng thứ người
           * dùng mong đợi khi muốn mở tab mới, mà bản `<button>` cũ không làm
           * được.
           *
           * Dùng `<a>` trần chứ không phải `next/link`: điều hướng thật là
           * nhánh hiếm, còn `Link` sẽ prefetch hàng chục trang mẫu đang nằm
           * trong khung nhìn.
           */
          <a
            href={`/${locale}/mau-thiep/${template.slug}`}
            aria-label={fill(dict.detail.open, { name: template.name })}
            className="absolute inset-0 z-10 cursor-pointer rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset"
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }
              event.preventDefault();
              resetPreview();
              onOpen(template, event.currentTarget);
            }}
          />
        ),
      }}
    />
  );
});
