import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dieu-khoan">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/dieu-khoan",
    title: dict.legal.terms.meta.title,
    description: dict.legal.terms.meta.description,
  });
}

export default async function TermsPage({
  params,
}: PageProps<"/[locale]/dieu-khoan">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <LegalPage
      locale={locale}
      dict={dict}
      documentKey="terms"
    />
  );
}
