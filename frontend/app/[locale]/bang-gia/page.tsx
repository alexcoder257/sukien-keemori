import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomCardOffer } from "@/components/pricing/custom-card-offer";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPricing } from "@/lib/data/pricing";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/schema-org";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/bang-gia">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/bang-gia",
    title: dict.pricing.meta.title,
    description: dict.pricing.meta.description,
  });
}

export default async function PricingPage({
  params,
}: PageProps<"/[locale]/bang-gia">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, pricing] = await Promise.all([
    getDictionary(locale),
    getPricing(),
  ]);

  return (
    <>
      <SiteHeader
        dict={dict.common}
        locale={locale}
      />
      <main>
        <div className="container-page space-y-12 py-16">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h1 className="text-h3">{dict.pricing.title}</h1>
            <p className="text-body-lg text-muted-foreground">
              {dict.pricing.subtitle}
            </p>
          </div>
          <CustomCardOffer
            dict={dict.pricing.custom}
            pricing={pricing}
            locale={locale}
          />
        </div>
      </main>
      <SiteFooter dict={dict.common} locale={locale} />

      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: dict.common.nav.pricing, path: "/bang-gia" },
        ])}
      />
    </>
  );
}
