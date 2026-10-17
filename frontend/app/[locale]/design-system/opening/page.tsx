import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { greatVibes, cormorant, lora } from "@/assets/fonts";
import { OpeningPlayground } from "@/components/invitation/opening-playground";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = { robots: NO_INDEX };

export default async function OpeningPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return (
    <div
      className={`${greatVibes.variable} ${cormorant.variable} ${lora.variable}`}
      style={
        {
          "--template-font-accent": "var(--font-great-vibes), cursive",
          "--template-font-display": "var(--font-cormorant), Georgia, serif",
          "--template-font-body": "var(--font-lora), Georgia, serif",
        } as CSSProperties
      }
    >
      <OpeningPlayground dict={dict.openingLab} />
    </div>
  );
}
