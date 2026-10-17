import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/dang-ky",
    title: dict.auth.register.title,
    description: dict.auth.register.subtitle,
    noIndex: true,
  });
}

export default async function RegisterPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  // Suspense: OAuthButtons dùng useSearchParams (đọc ?next=).
  return (
    <Suspense fallback={null}>
      <RegisterForm
        dict={dict.auth}
        phoneFieldDict={dict.common.phoneField}
        termsDict={dict.legal.terms}
        privacyDict={dict.legal.privacy}
        legalSharedDict={dict.legal.shared}
        locale={locale}
      />
    </Suspense>
  );
}
