import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaqAccordion } from "@/components/home/story/faq-accordion";
import { RevealText } from "@/components/home/story/reveal-text";
import { StoryReveal } from "@/components/home/story/story-reveal";
import type { Dictionary } from "@/i18n/dictionaries";
import { getFaqs } from "@/lib/data/home";

type Props = {
  dict: Dictionary["home"]["faq"];
  locale: string;
  /**
   * Số câu hiện ở đây. Kho FAQ có hàng chục câu; đổ hết vào một chương của
   * trang chủ thì phần "gỡ băn khoăn cuối" dài hơn cả câu chuyện dẫn tới nó.
   * Bỏ trống là hiện toàn bộ.
   */
  limit?: number;
};

/** Chương 5 — gỡ nốt băn khoăn cuối cùng trước khi bắt đầu. */
export async function Faq({ dict, locale, limit }: Props) {
  /* Câu hỏi lấy từ backend, còn tiêu đề và câu dẫn vẫn ở dictionary: hai thứ
     đổi vì lý do khác nhau — nội dung FAQ đổi khi **chính sách sản phẩm** đổi,
     còn nhãn của khối thì đổi khi làm lại giao diện. */
  const all = await getFaqs(locale);
  const items = limit ? all.slice(0, limit) : all;

  return (
    <div className="container-page grid gap-12 pt-10 pb-section lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      {/* `top-44` để cột dính này nằm dưới nhãn chương cũng đang dính ở mép trên. */}
      <div className="space-y-4 lg:sticky lg:top-44 lg:self-start">
        <RevealText
          as="h2"
          text={dict.title}
          className="font-editorial text-[clamp(2.35rem,4.4vw,3.75rem)] leading-[1.12] font-medium tracking-[-0.03em]"
        />
        <StoryReveal>
          <p className="max-w-sm text-body text-muted-foreground">
            {dict.subtitle}
          </p>
        </StoryReveal>
      </div>

      <div className="space-y-8">
        {/* `FaqAccordion` tự reveal từng hàng nên không bọc thêm reveal ở đây. */}
        <FaqAccordion items={items} />

        {/* Đường dẫn nội bộ tới trang FAQ đầy đủ, **luôn hiện** kể cả khi
            `limit` không cắt câu nào: kho FAQ do CMS quản nên số câu đổi bất cứ
            lúc nào, mà một khối FAQ có lối đi tiếp thì không phụ thuộc vào con
            số đó. Đây cũng là link đưa con bò tới trang duy nhất khai
            `FAQPage`. Vì vậy nhãn không mang số lượng. */}
        <StoryReveal>
          <Link
            href={`/${locale}/cau-hoi-thuong-gap`}
            className="group inline-flex items-center gap-2 text-body font-medium text-primary underline-offset-4 hover:underline"
          >
            {dict.seeAll}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </StoryReveal>
      </div>

      {/* Không khai `FAQPage` ở đây. Google chỉ nhận schema khi **mọi** câu hỏi
          khai trong đó hiển thị trên chính trang đó, mà khối này chỉ hiện một
          phần; và cùng một khối FAQPage lặp trên trang chủ, trang hướng dẫn lẫn
          trang FAQ thì ba trang tự cạnh tranh nhau. Toàn bộ danh sách cùng
          `faqSchema` giờ nằm ở `/cau-hoi-thuong-gap`. */}
    </div>
  );
}
