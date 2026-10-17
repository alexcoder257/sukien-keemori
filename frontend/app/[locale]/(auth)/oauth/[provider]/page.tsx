import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OAuthCallback } from "@/components/auth/oauth-callback";
import { OAUTH_PROVIDER_LABEL, isOAuthProvider } from "@/constants/oauth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

// Trang trung chuyển, không có nội dung để index.
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/oauth/[provider]">): Promise<Metadata> {
  const { provider } = await params;
  const label = isOAuthProvider(provider)
    ? OAUTH_PROVIDER_LABEL[provider]
    : provider;
  return {
    title: `Đăng nhập bằng ${label} — Keemori`,
    robots: { index: false, follow: false },
  };
}

export default async function OAuthCallbackPage({
  params,
}: PageProps<"/[locale]/oauth/[provider]">) {
  const { locale, provider } = await params;
  if (!isLocale(locale) || !isOAuthProvider(provider)) notFound();
  const dict = await getDictionary(locale);
  return <OAuthCallback dict={dict.auth} locale={locale} provider={provider} />;
}
