"use client";

import { CardRail } from "@/components/home/story/card-rail";
import { FeaturedTemplateCard } from "@/components/home/story/featured-template-card";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { WeddingTemplate } from "@/lib/data/templates";

type Props = {
  templates: WeddingTemplate[];
  dict: Dictionary["templates"];
  commonDict: Dictionary["common"];
  locale: Locale;
  label: string;
};

/**
 * Dải mẫu nổi bật ở trang chủ: cùng `CardRail` với slider cặp đôi, chỉ khác
 * hai công tắc — **tự chạy** (người xem không phải làm gì cũng thấy được nhiều
 * mẫu) và **tràn hết bề ngang** (dải cắt qua hai mép màn hình thì người xem
 * hiểu ngay là còn mẫu ở phía sau).
 *
 * Khổ mỗi tấm giữ đúng tỷ lệ của card kho mẫu để `poster.avif` và
 * `thumbnail.avif` dùng chung được, xem `FeaturedTemplateCard`.
 */
export function FeaturedRail({
  templates,
  dict,
  commonDict,
  locale,
  label,
}: Props) {
  return (
    <CardRail
      autoplay
      bleed
      items={templates}
      getKey={(template) => template.id}
      label={label}
      prevLabel={commonDict.actions.prev}
      nextLabel={commonDict.actions.next}
      itemClassName="w-[15rem] pr-5 sm:w-[17rem] lg:w-[19rem]"
      renderItem={(template) => (
        <FeaturedTemplateCard
          template={template}
          dict={dict}
          commonDict={commonDict}
          locale={locale}
        />
      )}
    />
  );
}
