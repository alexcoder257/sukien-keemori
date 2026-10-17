import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoupleShowcase } from "@/components/home/couple-showcase";
import { Faq } from "@/components/home/faq";
import { FeaturedTemplates } from "@/components/home/featured-templates";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { StoryChapter } from "@/components/home/story/story-chapter";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCoupleShowcase } from "@/lib/data/home";
import { getPublicSettings } from "@/lib/data/settings";
import { getHomepageTemplates } from "@/lib/data/templates";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import {
  organizationSchema,
  webApplicationSchema,
  webSiteSchema,
} from "@/lib/schema-org";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "",
    title: dict.home.meta.title,
    description: dict.home.meta.description,
  });
}

/**
 * Homepage được kể như một câu chuyện năm chương: tông nền đi từ đêm (forest)
 * sang ngày (paper/ivory) rồi quay lại đêm ở lời mời cuối. Mỗi chương là một
 * `StoryChapter`; toàn bộ chuyển động nằm trong các client component dưới
 * `components/home/story/`.
 */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Các nguồn độc lập: không để phần cuối trang chờ lần lượt từng API.
  const [dict, templates, couples, settings] =
    await Promise.all([
      getDictionary(locale),
      getHomepageTemplates(),
      getCoupleShowcase(),
      // Cùng request đã cache mà hero và chân trang dùng — không tốn thêm lượt
      // gọi backend nào.
      getPublicSettings(),
    ]);
  const chapters = dict.home.chapters;
  // Kho mẫu trống thì bỏ hẳn chương "Tìm phong cách" (một dải trống chỉ có
  // tiêu đề trông như lỗi), và đánh số lại các chương sau để không nhảy 01→03.
  // Cùng luật cho chương "Trao lời mời": nó chỉ còn dải cặp đôi, dải đó tự ẩn
  // khi không có ô nào, và chương rỗng thì chỉ còn trơ nhãn.
  const hasTemplates = templates.length > 0;
  const hasCouples = couples.length > 0;
  const chapterOrder: (keyof typeof chapters)[] = [
    "beginning",
    ...(hasTemplates ? (["style"] as const) : []),
    ...(hasCouples ? (["share"] as const) : []),
    "forever",
  ];
  const chapterIndex = (key: keyof typeof chapters) =>
    String(chapterOrder.indexOf(key) + 1).padStart(2, "0");

  return (
    <>
      {/* Danh tính site cho Google: `Organization` là đơn vị chủ quản,
          `WebSite` là chính website này, `WebApplication` là sản phẩm (dùng
          miễn phí được). Đặt ở trang chủ vì đó là nơi Google gán thực thể gốc;
          các khối khác trong site trỏ về chúng bằng `@id` thay vì lặp lại. */}
      <JsonLd
        data={organizationSchema([
          settings.facebookUrl,
          settings.instagramUrl,
          settings.tiktokUrl,
        ])}
      />
      <JsonLd data={webSiteSchema(locale)} />
      <JsonLd
        data={webApplicationSchema(locale, dict.home.meta.description)}
      />
      <SiteHeader
        dict={dict.common}
        locale={locale}
        overlay
      />
      <main>
        <StoryChapter
          id="khoi-dau"
          index={chapterIndex("beginning")}
          label={chapters.beginning.label}
          tone="forest"
          // Chương mở đầu tự vẽ mốc chương trong cột chữ của hero, nên nhãn ở
          // đây chỉ còn nhiệm vụ đặt tên cho section với screen reader.
          labelPlacement="sr-only"
        >
          <Hero
            dict={dict.home.hero}
            scrollHint={dict.common.scrollHint}
            locale={locale}
          />
        </StoryChapter>

        {hasTemplates ? (
          <StoryChapter
            id="tim-phong-cach"
            index={chapterIndex("style")}
            label={chapters.style.label}
            tone="paper"
            // Màu chính xác của cảnh mở đầu (`--reveal-black`), không phải
            // `forest-ink`: hai màu gần giống nhau nhưng khác hex, và đây là chỗ
            // duy nhất hai bề mặt chạm nhau nên lệch một khấc là lộ ngay.
            seamColor="bg-[#080806]"
          >
            <FeaturedTemplates
              templates={templates}
              dict={dict.home.featured}
              templatesDict={dict.templates}
              commonDict={dict.common}
              locale={locale}
            />
          </StoryChapter>
        ) : null}

        {hasCouples ? (
          <StoryChapter
            id="trao-loi-moi"
            index={chapterIndex("share")}
            label={chapters.share.label}
            tone="paper"
            // Chương trước là chương mẫu (`paper`: sáng ra `paper`, tối ra
            // `forest-ink` thuần), hoặc cảnh mở đầu khi kho mẫu trống — cùng
            // màu với seam của chương mẫu.
            seamColor={
              hasTemplates ? "bg-paper dark:bg-forest-ink" : "bg-[#080806]"
            }
          >
            <CoupleShowcase
              couples={couples}
              dict={dict.home.couples}
              locale={locale}
            />
          </StoryChapter>
        ) : null}

        <StoryChapter
          id="bat-dau-mai-mai"
          index={chapterIndex("forever")}
          label={chapters.forever.label}
          tone="forest"
          // Chương trước là tông `paper` (chương cặp đôi hoặc chương mẫu), tức
          // nền của chính chế độ đang bật: sáng thì là giấy, tối thì đã là
          // Forest Ink nên dải chuyển tiếp tự tan vào chương này. Không còn
          // chương nào thì chương trước là cảnh mở đầu.
          seamColor={
            hasTemplates || hasCouples
              ? "bg-paper dark:bg-forest-ink"
              : "bg-[#080806]"
          }
        >
          <Faq dict={dict.home.faq} locale={locale} limit={6} />
          <FinalCta dict={dict.home.finalCta} locale={locale} />
        </StoryChapter>
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
