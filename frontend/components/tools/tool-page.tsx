import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaqAccordion } from "@/components/home/story/faq-accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand } from "@/components/shared/cta-band";
import { PageHero } from "@/components/shared/page-hero";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { TOOLS, TOOLS_PATH, toolPath, type ToolKey } from "@/constants/tools";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { breadcrumbSchema, faqSchema, toolSchema } from "@/lib/schema-org";

type Props = {
  toolKey: ToolKey;
  dict: Dictionary;
  locale: Locale;
  /** Phần tương tác (Client Component) của công cụ. */
  children: ReactNode;
};

/**
 * Khung chung của một trang công cụ: đầu trang, công cụ, cách dùng, giải thích,
 * câu hỏi thường gặp, các công cụ khác và lời mời tạo thiệp.
 *
 * Phần chữ render ở server và đứng **quanh** công cụ chứ không nằm trong nó:
 * thứ Google lập chỉ mục là đoạn giải thích, còn widget chỉ chạy sau khi tải.
 * FAQ ở đây khai `FAQPage` vì toàn bộ câu hỏi hiện trên chính trang — đây là
 * câu hỏi riêng của công cụ, không trùng kho FAQ ở `/cau-hoi-thuong-gap`.
 */
export function ToolPage({ toolKey, dict, locale, children }: Props) {
  const t = dict.tools;
  const tool = t.items[toolKey];
  const path = toolPath(toolKey);

  return (
    <>
      <SiteHeader dict={dict.common} locale={locale} />
      <main>
        <PageHero eyebrow={t.eyebrow} title={tool.title} subtitle={tool.subtitle} />

        <section className="container-page py-12 lg:py-16">{children}</section>

        <section className="border-t border-border">
          <div className="container-page grid gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
            <div>
              <h2 className="font-heading text-h4 font-medium">{t.howToTitle}</h2>
              <ol className="mt-6 space-y-5">
                {tool.howTo.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span
                      aria-hidden
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-current/45 font-heading text-small text-(--gold-ink) tabular-nums"
                    >
                      {index + 1}
                    </span>
                    <p className="pt-1.5 text-body text-muted-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="font-heading text-h4 font-medium">{tool.notes.title}</h2>
              <div className="mt-6 space-y-4 text-body text-muted-foreground">
                {tool.notes.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="container-page py-16 lg:py-20">
            <h2 className="mb-stack font-heading text-h4 font-medium">{t.faqTitle}</h2>
            <div className="max-w-3xl">
              <FaqAccordion items={tool.faqs} />
            </div>
          </div>
        </section>

        <section className="container-page py-16 lg:py-20">
          <h2 className="mb-stack font-heading text-h4 font-medium">{t.relatedTitle}</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {TOOLS.filter((item) => item.key !== toolKey).map((item) => (
              <li key={item.key}>
                <Link
                  href={`/${locale}${TOOLS_PATH}/${item.slug}`}
                  className="group flex h-full flex-col gap-2 rounded-2xl border border-border p-6 transition-colors hover:border-(--gold-ink)/45"
                >
                  <span className="font-heading text-body-lg font-medium">
                    {t.items[item.key].card.title}
                  </span>
                  <span className="text-small text-muted-foreground">
                    {t.items[item.key].card.body}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-2 pt-2 text-small font-medium text-(--gold-ink)">
                    {t.open}
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <CtaBand
          title={t.cta.title}
          body={t.cta.body}
          primary={{ label: t.cta.action, href: `/${locale}/mau-thiep` }}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />

      <JsonLd
        data={toolSchema({
          locale,
          path,
          name: tool.title,
          description: tool.meta.description,
        })}
      />
      <JsonLd data={faqSchema(tool.faqs)} />
      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: t.breadcrumb, path: TOOLS_PATH },
          { name: tool.title, path },
        ])}
      />
    </>
  );
}
