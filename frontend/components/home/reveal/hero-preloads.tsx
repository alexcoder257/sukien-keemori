"use client";

import { HERO_PORTRAIT } from "./portrait";

/**
 * Preload ảnh LCP của cảnh mở đầu trang chủ.
 *
 * **Phải là Client Component.** Viết thẳng `<link rel="preload">` trong
 * `hero.tsx` (Server Component) thì React đưa nó vào payload RSC dưới dạng
 * resource hint (`:HL[...]`), và hint được thực thi **ngay khi payload về** —
 * kể cả payload *prefetch*. Logo trên header trỏ về trang chủ nên trang chủ bị
 * prefetch từ mọi trang, tức mọi trang đều âm thầm tải ~530KB ảnh hero. Trên 3G
 * đó là hơn chục giây giành đường truyền, và request chuyển trang thật phải
 * xếp hàng sau nó (đo được: 24s "Stalled" khi bấm từ kho mẫu về trang chủ).
 *
 * Ở client, component chỉ chạy khi trang chủ thật sự render. Lúc mở thẳng
 * trang chủ nó vẫn được render ở server và React vẫn nhấc các `<link>` này lên
 * `<head>` của HTML, nên ưu tiên tải ảnh LCP không đổi.
 */
export function HeroPreloads() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/images/site/invitation-paper.avif"
        type="image/avif"
      />
      <link
        rel="preload"
        as="image"
        href={HERO_PORTRAIT.mobileSrc}
        media={HERO_PORTRAIT.mobileMedia}
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={HERO_PORTRAIT.src}
        imageSrcSet={HERO_PORTRAIT.desktopSrcSet}
        imageSizes={HERO_PORTRAIT.desktopSizes}
        media={HERO_PORTRAIT.desktopMedia}
        fetchPriority="high"
      />
    </>
  );
}
