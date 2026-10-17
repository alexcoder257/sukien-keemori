import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FeaturedRail } from "@/components/home/story/featured-rail";
import { EditorialBlock } from "@/components/home/story/editorial-block";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { WeddingTemplate } from "@/lib/data/templates";

type Props = {
  templates: WeddingTemplate[];
  dict: Dictionary["home"]["featured"];
  templatesDict: Dictionary["templates"];
  commonDict: Dictionary["common"];
  locale: Locale;
};

/**
 * Chương 2 — chọn phong cách. Dải mẫu do CMS chọn chạy ngang, lặp vô tận và **tự
 * chạy**: người xem không phải làm gì cũng thấy được nhiều mẫu.
 *
 * Trước đây dải này bị GSAP ghim lại và kéo ngang theo tiến độ cuộn dọc. Cách
 * đó buộc cả chương phải cao bằng đúng quãng kéo, nên chương này một mình
 * chiếm mấy màn hình cuộn và mọi section phía dưới phải chờ nó. Bỏ pin đi thì
 * chương trở lại đúng chiều cao nội dung của nó, còn phần "khoe mẫu" giao cho
 * dải tự chạy (`FeaturedRail`) — dừng lại khi rê chuột vào, và hai nút
 * trước/sau cho người muốn tự lật. Dải đó là `CardRail`, dùng chung với slider
 * cặp đôi ở chương 4; chương này chỉ bật thêm `autoplay` và `bleed`.
 *
 * Khổ mỗi tấm giữ đúng tỷ lệ của card kho mẫu để `poster.avif` và
 * `thumbnail.avif` dùng chung được, xem `FeaturedTemplateCard`.
 */
export function FeaturedTemplates({
  templates,
  dict,
  templatesDict,
  commonDict,
  locale,
}: Props) {
  return (
    <div className="pt-10 pb-section">
      <EditorialBlock
        className="container-page"
        title={dict.title}
        body={<p>{dict.subtitle}</p>}
        // Không truyền `eyebrow`: nhãn chương "02 · Tìm phong cách" đang dính
        // ngay phía trên, hai nhãn nhỏ chồng nhau chỉ làm loãng đầu section.
        meta={
          <Link
            href={`/${locale}/mau-thiep`}
            className="inline-flex items-center gap-2 border-b border-input pb-1 text-small font-medium whitespace-nowrap transition-colors hover:border-primary hover:text-primary"
          >
            {commonDict.actions.viewAll}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />

      <FeaturedRail
        templates={templates}
        dict={templatesDict}
        commonDict={commonDict}
        locale={locale}
        label={dict.title}
      />
    </div>
  );
}
