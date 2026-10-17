import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thanh-toan-hoan-tien">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/thanh-toan-hoan-tien",
    title: dict.legal.paymentRefund.meta.title,
    description: dict.legal.paymentRefund.meta.description,
  });
}

export default async function PaymentRefundPage({
  params,
}: PageProps<"/[locale]/thanh-toan-hoan-tien">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <LegalPage
      locale={locale}
      dict={dict}
      documentKey="paymentRefund"
    />
  );
}
