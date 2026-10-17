import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateGallery } from "@/components/template/template-gallery";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getTemplates } from "@/lib/data/templates";
import { getReferenceInvitations } from "@/lib/data/reference-invitations";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/schema-org";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mau-thiep">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/mau-thiep",
    title: dict.templates.meta.title,
    description: dict.templates.meta.description,
  });
}

export default async function TemplatesPage({
  params,
}: PageProps<"/[locale]/mau-thiep">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, templates] = await Promise.all([
    getDictionary(locale),
    getTemplates(),
  ]);

  // Header, phần mở đầu và footer nằm ở `layout.tsx` cùng group — xem lý do ở
  // đó. Trang chỉ còn phần phải chờ dữ liệu.
  return (
    <>
      <TemplateGallery
        templates={templates}
        referenceInvitations={getReferenceInvitations()}
        dict={dict.templates}
        commonDict={dict.common}
        locale={locale}
      />

      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: dict.common.nav.templates, path: "/mau-thiep" },
        ])}
      />
    </>
  );
}
