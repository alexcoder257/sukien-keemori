import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideChecklist } from "@/components/guide/guide-checklist";
import { GuideFieldMap } from "@/components/guide/guide-field-map";
import { GuideTips } from "@/components/guide/guide-tips";
import { CtaBand } from "@/components/shared/cta-band";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getGuideChecklist,
  getGuideSteps,
  getGuideTips,
} from "@/lib/data/guide";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/schema-org";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/huong-dan">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/huong-dan",
    title: dict.guide.meta.title,
    description: dict.guide.meta.description,
  });
}

export default async function GuidePage({
  params,
}: PageProps<"/[locale]/huong-dan">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const steps = getGuideSteps();


  return (
    <>
      <SiteHeader
        dict={dict.common}
        locale={locale}
      />
      <main>
        <header className="border-b border-border bg-card">
          <div className="container-page py-12 lg:py-16">
            <p className="text-eyebrow text-primary">{dict.guide.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-h2 font-medium leading-tight">{dict.guide.title}</h1>
            <p className="mt-5 max-w-2xl text-body-lg text-muted-foreground">{dict.guide.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#field-map" className={buttonVariants()}>{dict.guide.checklistAction}</a>
              <Link href={`/${locale}/mau-thiep`} className={buttonVariants({ variant: "outline" })}>{dict.guide.startAction}</Link>
            </div>
          </div>
        </header>

        <GuideFieldMap dict={dict.guide.fieldMap} />

        <section className="container-page pb-section pt-8">
          <h2 className="text-h3 font-medium">{dict.guide.stepsTitle}</h2>
          <p className="mt-3 max-w-2xl text-body-lg text-muted-foreground">{dict.guide.stepsSubtitle}</p>
          <ol className="mt-8 grid items-start gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.key} id={`step-${step.key}`} className="scroll-mt-24 border-t border-primary/40 pt-5">
                <span className="text-eyebrow text-primary">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-body-lg font-medium">{dict.guide.steps[step.key].title}</h3>
                <p className="mt-3 text-small leading-relaxed text-muted-foreground">{dict.guide.steps[step.key].body}</p>
                <ol className="mt-5 space-y-4">
                  {dict.guide.steps[step.key].instructions.map((item) => <li key={item.title}><h4 className="text-small font-medium">{item.title}</h4><p className="mt-1 text-small leading-relaxed text-muted-foreground">{item.body}</p></li>)}
                </ol>
                <Link href={`/${locale}${step.actionPath}`} className={buttonVariants({ variant: "outline", className: "mt-6" })}>{dict.guide.steps[step.key].action}</Link>
              </li>
            ))}
          </ol>
        </section>

        <section id="prepare" className="scroll-mt-24 border-t border-border bg-card">
          <div className="container-page py-16 lg:py-20">
            <div className="mb-stack max-w-2xl">
              <h2 className="font-heading text-h4 font-medium">
                {dict.guide.checklist.title}
              </h2>
              <p className="mt-3 text-body-lg text-muted-foreground">
                {dict.guide.checklist.subtitle}
              </p>
            </div>
            <GuideChecklist
              groups={getGuideChecklist()}
              dict={dict.guide.checklist}
            />
          </div>
        </section>

        <GuideTips tips={getGuideTips()} dict={dict.guide.tips} />

        <CtaBand
          title={dict.guide.cta.title}
          body={dict.guide.cta.body}
          primary={{
            label: dict.guide.cta.primary,
            href: `/${locale}/mau-thiep`,
          }}
          secondary={{
            label: dict.guide.cta.secondary,
            href: `/${locale}/bang-gia`,
          }}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />

      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: dict.common.nav.guide, path: "/huong-dan" },
        ])}
      />
    </>
  );
}
