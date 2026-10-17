import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, QrCode, Users } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand } from "@/components/shared/cta-band";
import { PageHero } from "@/components/shared/page-hero";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { TOOLS, TOOLS_PATH, type ToolKey } from "@/constants/tools";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { breadcrumbSchema } from "@/lib/schema-org";
import { buildMetadata } from "@/lib/seo";

const ICONS: Record<ToolKey, typeof CalendarDays> = {
  lunar: CalendarDays,
  tables: Users,
  qr: QrCode,
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cong-cu">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: TOOLS_PATH,
    title: dict.tools.hub.meta.title,
    description: dict.tools.hub.meta.description,
  });
}

/**
 * `/cong-cu` — trang tổng hợp công cụ miễn phí cho việc chuẩn bị cưới.
 *
 * Mỗi công cụ là một trang riêng có chữ giải thích và FAQ của nó; trang này chỉ
 * giới thiệu và dẫn đường, nên không khai schema nào ngoài breadcrumb.
 */
export default async function ToolsHubPage({
  params,
}: PageProps<"/[locale]/cong-cu">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.tools;

  return (
    <>
      <SiteHeader dict={dict.common} locale={locale} />
      <main>
        <PageHero eyebrow={t.eyebrow} title={t.hub.title} subtitle={t.hub.subtitle} />

        <section className="container-page py-16 lg:py-20">
          <ul className="grid gap-4 md:grid-cols-3">
            {TOOLS.map((tool) => {
              const Icon = ICONS[tool.key];
              const copy = t.items[tool.key].card;
              return (
                <li key={tool.key}>
                  <Link
                    href={`/${locale}${TOOLS_PATH}/${tool.slug}`}
                    className="group flex h-full flex-col gap-4 rounded-2xl border border-border p-6 transition-[translate,border-color] duration-300 hover:-translate-y-1 hover:border-(--gold-ink)/45 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <span
                      aria-hidden
                      className="inline-flex size-11 items-center justify-center rounded-full border border-current/45 text-(--gold-ink)"
                    >
                      <Icon className="size-5" strokeWidth={1.5} />
                    </span>
                    <span className="font-heading text-body-lg font-medium">
                      {copy.title}
                    </span>
                    <span className="text-small text-muted-foreground">{copy.body}</span>
                    <span className="mt-auto inline-flex items-center gap-2 text-small font-medium text-(--gold-ink)">
                      {t.open}
                      <ArrowRight
                        aria-hidden
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
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
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: t.breadcrumb, path: TOOLS_PATH },
        ])}
      />
    </>
  );
}
