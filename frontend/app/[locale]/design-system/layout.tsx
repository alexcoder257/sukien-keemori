import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystemNav } from "@/components/design-system/design-system-nav";
import { isLocale } from "@/i18n/config";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = { robots: NO_INDEX };

export default async function DesignSystemLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Giữ chốt ở cây route cho cả đường dẫn không đi qua proxy.
  if (process.env.NODE_ENV !== "development") notFound();
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DesignSystemNav locale={locale} />
      {children}
    </div>
  );
}
