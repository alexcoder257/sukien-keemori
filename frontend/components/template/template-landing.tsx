import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Eye, PenLine } from "lucide-react";
import { FaqAccordion } from "@/components/home/story/faq-accordion";
import { PosterCard } from "@/components/shared/poster-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import type { WeddingTemplate } from "@/lib/data/templates";
import type { TemplatePageCopy } from "@/lib/template-page-copy";
import { templateEditorHref } from "@/lib/template-links";
import { templateFeatures } from "@/components/template/template-features";

type Props = {
  template: WeddingTemplate;
  related: WeddingTemplate[];
  /** `undefined` khi mẫu chưa được viết chữ giới thiệu — trang vẫn dựng được. */
  copy?: TemplatePageCopy;
  dict: Dictionary;
  locale: Locale;
};

const SECTION_TITLE =
  "font-editorial text-[clamp(1.75rem,3vw,2.25rem)] leading-tight font-medium tracking-[-0.03em]";
const BLOCK_TITLE = "font-editorial text-h4 leading-tight font-medium";

/**
 * Thân trang giới thiệu một mẫu thiệp (`/mau-thiep/<slug>`).
 *
 * Ba nhịp, mỗi nhịp trả lời một câu người chọn mẫu hỏi theo đúng thứ tự:
 * **mẫu này là gì** (tên, phong cách, câu dẫn, poster, hai nút) → **nhìn trọn
 * nó ra sao** (ảnh chụp dài của cả tấm thiệp trong một khung cuộn, cạnh phần
 * giới thiệu, điểm nổi bật, tính năng) → **còn băn khoăn gì** (FAQ, mẫu tương
 * tự).
 *
 * Ảnh xem trước dùng hai tệp đã có sẵn cho card kho mẫu — `poster.avif` và
 * `thumbnail.avif` — theo quy ước đường dẫn, không chụp thêm gì cho trang này.
 */
export function TemplateLanding({
  template,
  related,
  copy,
  dict,
  locale,
}: Props) {
  const tp = dict.templatePages;
  const detail = dict.templates.detail;
  const name = template.name;
  const photoCount = template.photoSlots.length;
  const demoHref = `/${locale}/mau-thiep/${template.slug}/demo`;
  const imageBase = `/images/templates/${template.slug}`;

  const [lead, ...overview] = copy?.intro ?? [
    fill(tp.genericLead, {
      name,
      styles: template.categories
        .map((category) => dict.templates.categories[category])
        .join(", ")
        .toLowerCase(),
    }),
  ];

  const features = templateFeatures(
    template,
    detail.features,
    photoCount ? fill(tp.photoCount, { count: String(photoCount) }) : tp.noPhotos,
  );

  return (
    <>
      {/* --- 1. Mẫu này là gì ------------------------------------------- */}
      <section className="glow-surface border-b border-border bg-card">
        <div className="container-page grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16 lg:py-16">
          <div className="space-y-6">
            <nav aria-label={tp.breadcrumbLabel}>
              <ol className="flex flex-wrap items-center gap-2 text-small text-muted-foreground">
                <li>
                  <Link href={`/${locale}`} className="hover:text-primary">
                    {tp.breadcrumbHome}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href={`/${locale}/mau-thiep`}
                    className="hover:text-primary"
                  >
                    {tp.breadcrumbTemplates}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-foreground">
                  {name}
                </li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              {template.categories.map((category) => (
                <Badge key={category} variant="outline" size="sm">
                  {dict.templates.categories[category]}
                </Badge>
              ))}
            </div>

            <h1 className="font-editorial text-[clamp(2.25rem,4.6vw,3.5rem)] leading-[1.12] font-medium tracking-[-0.03em]">
              {fill(tp.heading, { name })}
              {/* Từ khoá phong cách/màu nằm **trong chính `h1`** thay vì một
                  dòng riêng bên dưới: vẫn là văn bản của thẻ tiêu đề — thẻ có
                  sức nặng nhất trang — nhưng cỡ nhỏ hơn nên không đẩy khối hero
                  xuống 3 dòng. Chữ vẫn kế thừa serif của `h1`, nên nó đọc ra
                  như phần nối của tiêu đề chứ không lẫn với câu dẫn sans ngay
                  bên dưới. */}
              {copy?.headingNote ? (
                <span className="mt-3 block text-[clamp(1.125rem,2vw,1.5rem)] leading-snug font-normal tracking-[-0.01em] text-muted-foreground">
                  {copy.headingNote}
                </span>
              ) : null}
            </h1>

            <p className="max-w-xl text-body-lg text-muted-foreground">
              {lead}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={templateEditorHref(locale, template)}
                className={buttonVariants({ className: "sm:min-w-48" })}
              >
                <PenLine />
                {detail.use}
              </Link>
              <Link
                href={demoHref}
                className={buttonVariants({
                  variant: "outline",
                  className: "sm:min-w-48",
                })}
              >
                <Eye />
                {detail.demo}
              </Link>
            </div>
            <p className="text-caption text-muted-foreground">
              {detail.customNote}{" "}
              <Link href={`/${locale}/lien-he`} className="underline underline-offset-4 hover:text-primary">
                {detail.choose}
              </Link>
            </p>
          </div>

          {/* Poster nghiêng nhẹ như một tấm thiệp đặt trên bàn — cả khung là
              lối vào bản demo, vì đó là thứ người ta muốn bấm khi nhìn ảnh. */}
          <Link
            href={demoHref}
            className="group relative mx-auto block w-full max-w-sm lg:mr-0"
          >
            <Image
              src={`${imageBase}/poster.avif`}
              alt={fill(tp.posterAlt, { name })}
              width={960}
              height={1231}
              priority
              sizes="(min-width: 1024px) 384px, 90vw"
              className="aspect-[0.78] w-full rotate-[1.5deg] rounded-3xl object-cover shadow-2xl ring-1 ring-foreground/10 transition-transform duration-500 group-hover:rotate-0"
            />
            <span className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/90 px-4 py-2 text-small font-medium shadow-lg backdrop-blur">
              {detail.demo}
              <ArrowUpRight className="size-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* --- 2. Nhìn trọn tấm thiệp ------------------------------------- */}
      <section className="container-page grid gap-12 py-16 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16 lg:py-20">
        {/* Ảnh chụp dài của cả tấm thiệp sau khi mở phong bì, trong khung tự
            cuộn. `unoptimized`: ảnh cao hơn 16.000px, qua bộ tối ưu của Next
            là sinh ra một bản JPEG khổng lồ thay vì phục vụ thẳng tệp AVIF đã
            nén sẵn. */}
        <figure className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="mx-auto h-[min(72svh,42rem)] max-w-sm overflow-y-auto overscroll-contain rounded-2xl bg-muted ring-1 ring-foreground/10 [scrollbar-width:thin] lg:max-w-none">
            <Image
              src={`${imageBase}/thumbnail.avif`}
              alt={fill(tp.previewAlt, { name })}
              width={960}
              height={16302}
              unoptimized
              loading="lazy"
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="mx-auto max-w-sm space-y-1 lg:max-w-none">
            <span className="block text-small font-medium">
              {tp.previewTitle}
            </span>
            <span className="block text-caption text-muted-foreground">
              {tp.previewNote}
            </span>
          </figcaption>
        </figure>

        <div className="space-y-12">
          {overview.length ? (
            <div className="space-y-4">
              <h2 className={SECTION_TITLE}>{tp.overviewTitle}</h2>
              {overview.map((paragraph) => (
                <p key={paragraph} className="text-body text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {copy ? (
            <div className="space-y-4">
              <h2 className={BLOCK_TITLE}>{tp.highlightsTitle}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {copy.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex gap-3 rounded-xl border border-border p-4 text-small text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {copy ? (
            <div className="space-y-3 border-l-2 border-primary/50 pl-5">
              <h2 className={BLOCK_TITLE}>{tp.suitableTitle}</h2>
              <p className="text-body text-muted-foreground">
                {copy.suitableFor}
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            <h2 className={BLOCK_TITLE}>{tp.featuresTitle}</h2>
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {features.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-small text-muted-foreground"
                >
                  <Icon className="size-4 shrink-0 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- 3. Còn băn khoăn gì ---------------------------------------- */}
      {copy ? (
        <section className="border-t border-border bg-card">
          <div className="container-page grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-20">
            <h2 className={`${SECTION_TITLE} lg:sticky lg:top-24 lg:self-start`}>
              {tp.faqTitle}
            </h2>
            <FaqAccordion items={copy.faqs} />
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="border-t border-border">
          <div className="container-page space-y-8 py-16 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className={SECTION_TITLE}>{tp.relatedTitle}</h2>
              <Link
                href={`/${locale}/mau-thiep`}
                className="inline-flex items-center gap-1.5 text-small text-primary hover:underline"
              >
                {tp.relatedAll}
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.slug}>
                  <PosterCard
                    action={{ href: `/${locale}/mau-thiep/${item.slug}` }}
                    media={{
                      imageSrc: item.imageSrc,
                      imagePosition: item.imagePosition,
                      alt: fill(tp.posterAlt, { name: item.name }),
                      sizes: "(max-width: 1024px) 45vw, 280px",
                    }}
                    title={item.name}
                    meta={item.categories
                      .map((category) => dict.templates.categories[category])
                      .join(" · ")}
                    footerClassName="mt-3"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
