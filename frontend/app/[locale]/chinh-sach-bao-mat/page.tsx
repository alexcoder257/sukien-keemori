import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/chinh-sach-bao-mat">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/chinh-sach-bao-mat",
    title: dict.legal.privacy.meta.title,
    description: dict.legal.privacy.meta.description,
  });
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/chinh-sach-bao-mat">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <LegalPage
      locale={locale}
      dict={dict}
      documentKey="privacy"
    />
  );
}
