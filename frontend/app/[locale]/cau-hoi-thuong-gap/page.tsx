import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/home/story/faq-accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand } from "@/components/shared/cta-band";
import { PageHero } from "@/components/shared/page-hero";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getFaqs } from "@/lib/data/home";
import { fill } from "@/lib/format";
import { breadcrumbSchema, faqSchema } from "@/lib/schema-org";
import { buildMetadata } from "@/lib/seo";

const PATH = "/cau-hoi-thuong-gap";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cau-hoi-thuong-gap">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: PATH,
    title: dict.faqPage.meta.title,
    description: dict.faqPage.meta.description,
  });
}

/**
 * `/cau-hoi-thuong-gap` — trang giữ **toàn bộ** kho FAQ.
 *
 * Đây là trang duy nhất khai `FAQPage` trong dữ liệu có cấu trúc. Trang chủ,
 * bảng giá và hướng dẫn vẫn có khối FAQ nhưng chỉ hiện 6 câu và không khai
 * schema — vừa vì điều kiện của Google (mọi câu trong schema phải hiển thị
 * trên chính trang đó), vừa để bốn trang không trở thành bốn bản trùng của
 * cùng một nội dung. Ba trang kia link về đây; đây là trang nhận tín hiệu.
 *
 * Đường dẫn giữ tiếng Việt ở cả hai locale, giống `/bang-gia` và `/huong-dan`.
 */
export default async function FaqPage({
  params,
}: PageProps<"/[locale]/cau-hoi-thuong-gap">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const faqs = await getFaqs(locale);
  const t = dict.faqPage;

  return (
    <>
      <SiteHeader
        dict={dict.common}
        locale={locale}
      />
      <main>
        <PageHero eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
          <p className="text-small text-muted-foreground tabular-nums">
            {fill(t.count, { count: faqs.length })}
          </p>
        </PageHero>

        {/* Cột hẹp hơn container: câu trả lời là văn bản đọc liền mạch, để
            tràn 1200px thì mỗi dòng dài quá tầm mắt. */}
        <section className="container-page py-16 lg:py-20">
          <div className="max-w-3xl">
            <FaqAccordion items={faqs} />
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="container-page flex flex-col gap-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
            <div className="max-w-xl">
              <h2 className="font-heading text-h4 font-medium">
                {t.help.title}
              </h2>
              <p className="mt-3 text-body-lg text-muted-foreground">
                {t.help.body}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/lien-he`}
                className={buttonVariants({ variant: "outline" })}
              >
                {t.help.contact}
              </Link>
              <Link
                href={`/${locale}/huong-dan`}
                className={buttonVariants({ variant: "ghost" })}
              >
                {t.help.guide}
              </Link>
            </div>
          </div>
        </section>

        <CtaBand
          title={t.cta.title}
          body={t.cta.body}
          primary={{ label: t.cta.primary, href: `/${locale}/mau-thiep` }}
          secondary={{ label: t.cta.secondary, href: `/${locale}/bang-gia` }}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />

      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: t.breadcrumb, path: PATH },
        ])}
      />
      {/* Đúng mảng vừa render ở trên, không phải một danh sách riêng. */}
      <JsonLd data={faqSchema(faqs)} />
    </>
  );
}
