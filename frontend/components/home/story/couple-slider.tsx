"use client";

import { CardRail } from "@/components/home/story/card-rail";
import { PosterCard } from "@/components/shared/poster-card";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/lib/format";
import type { CoupleShowcase } from "@/lib/data/home";
import { showcaseHref } from "@/lib/showcase-link";

type Props = {
  couples: CoupleShowcase[];
  dict: Dictionary["home"]["couples"];
  locale: Locale;
};

/**
 * Chương 4 — thiệp thật đã được gửi đi, dựng trên `CardRail` ở chế độ **lật
 * theo trang**: đứng yên cho tới khi người dùng cuộn hoặc bấm.
 *
 * Hai bản trước của khối này đều **chạy liên tục** (dải ngang, rồi tường ba cột
 * trôi dọc) và cả hai đều làm cả trang khựng. Nguyên nhân không nằm ở một chi
 * tiết sửa được: một vòng lặp không bao giờ dừng buộc trình duyệt raster lại
 * lớp đang chạy ở mọi khung hình, mà nội dung ở đây là ảnh thiệp — thứ nặng
 * nhất trên trang. Chương 2 chạy liên tục được vì nó chỉ có **một** dải; thêm
 * một khối chạy nữa trong cùng một trang là nhân đôi khoản đó.
 *
 * Nên chương này bỏ hẳn chuyển động nền, và **cũng vì thế nó không trùng cảm
 * giác với chương 2**: một bên tự trôi, một bên do người xem lật. Đó là lý do
 * `autoplay` ở đây tắt dù dùng chung component với dải mẫu nổi bật.
 *
 * Danh sách **không nhân đôi** — slider có điểm đầu và điểm cuối, nên số ảnh
 * đúng bằng số cặp đôi.
 */
export function CoupleSlider({ couples, dict, locale }: Props) {
  return (
    <CardRail
      items={couples}
      getKey={(couple) => couple.slug}
      label={dict.title}
      prevLabel={dict.prev}
      nextLabel={dict.next}
      // Ba tấm một trang ở desktop, và mỗi tấm cùng một khổ — bề rộng chia
      // đều, chiều cao do khung `aspect-[0.78]` (đúng khổ card kho mẫu, nên
      // dùng chung được `poster.avif`).
      itemClassName="w-[78%] pr-5 sm:w-[46%] lg:w-1/3"
      renderItem={(couple) => (
        <PosterCard
          action={{ href: showcaseHref(couple.kind, couple.slug, locale) }}
          media={{
            imageSrc: couple.imageSrc,
            posterSrc: couple.posterSrc,
            imagePosition: couple.imagePosition,
            alt: `Thiệp cưới ${couple.names}`,
            sizes: "(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 380px",
          }}
          title={couple.names}
          titleAs="p"
          // Cột hẹp ở mobile: giữ `text-body-lg` thì gần như tên nào cũng gãy
          // làm hai dòng.
          titleClassName="text-body sm:text-body-lg"
          meta={fill(dict.weddingDate, { date: couple.weddingDate })}
          footerClassName="mt-3"
        />
      )}
    />
  );
}
