import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
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
    path: "/dang-nhap",
    title: dict.auth.login.title,
    description: dict.auth.login.subtitle,
    noIndex: true,
  });
}

export default async function LoginPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  // Suspense: LoginForm dùng useSearchParams (đọc ?next=).
  return (
    <Suspense fallback={null}>
      <LoginForm dict={dict.auth} locale={locale} />
    </Suspense>
  );
}
