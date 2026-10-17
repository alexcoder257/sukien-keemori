import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessInfoPage } from "@/components/legal/business-info-page";
import { BUSINESS_INFO_PAGE } from "@/constants/legal";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thong-tin-doanh-nghiep">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: BUSINESS_INFO_PAGE.path,
    title: dict.legal.businessInfo.meta.title,
    description: dict.legal.businessInfo.meta.description,
  });
}

export default async function BusinessInfoRoute({
  params,
}: PageProps<"/[locale]/thong-tin-doanh-nghiep">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return <BusinessInfoPage locale={locale} dict={dict} />;
}
