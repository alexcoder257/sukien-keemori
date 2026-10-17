import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactChannels } from "@/components/contact/contact-channels";
import { getPublicSettings } from "@/lib/data/settings";
import { PageHero } from "@/components/shared/page-hero";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/schema-org";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lien-he">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/lien-he",
    title: dict.contact.meta.title,
    description: dict.contact.meta.description,
  });
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/lien-he">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const { messengerUrl, instagramUrl, tiktokUrl, zaloPhone } =
    await getPublicSettings();
  const t = dict.contact;

  return (
    <>
      <SiteHeader
        dict={dict.common}
        locale={locale}
      />
      <main>
        <PageHero eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
          <p className="text-small text-muted-foreground">{t.responseNote}</p>
        </PageHero>

        <section className="container-page py-16 lg:py-20">
          <h2 className="mb-stack font-heading text-h4 font-medium">
            {t.channelsTitle}
          </h2>
          <ContactChannels
            dict={t}
            messengerUrl={messengerUrl}
            instagramUrl={instagramUrl}
            tiktokUrl={tiktokUrl}
            zaloPhone={zaloPhone}
          />
          <p className="mt-8 text-small text-muted-foreground">{t.formNote}</p>
        </section>

        <section className="border-t border-border bg-card">
          <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:py-20">
            <div>
              <h2 className="font-heading text-h4 font-medium">
                {t.hoursTitle}
              </h2>
              <ul className="mt-5 space-y-2">
                {t.hours.map((line) => (
                  <li key={line} className="text-body text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-h4 font-medium">
                {t.beforeTitle}
              </h2>
              <p className="mt-5 max-w-md text-body text-muted-foreground">
                {t.beforeBody}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/huong-dan`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t.beforeGuide}
                </Link>
                <Link
                  href={`/${locale}/bang-gia`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t.beforePricing}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter dict={dict.common} locale={locale} />

      {/* `eyebrow` ("Liên hệ") chứ không phải `title`: tiêu đề trang là một câu
          mời ("Cần hỗ trợ? …"), đọc như một mắt xích đường dẫn thì quá dài. */}
      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: t.eyebrow, path: "/lien-he" },
        ])}
      />
    </>
  );
}
