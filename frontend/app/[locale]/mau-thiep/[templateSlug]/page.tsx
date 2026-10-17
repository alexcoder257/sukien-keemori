import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { TemplateLanding } from "@/components/template/template-landing";
import { TemplateViewBeacon } from "@/components/template/template-view-beacon";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import { getCatalogTemplateBySlug, getTemplates } from "@/lib/data/templates";
import { breadcrumbSchema, faqSchema, templateSchema } from "@/lib/schema-org";
import { buildMetadata } from "@/lib/seo";
import { templatePageCopy } from "@/lib/template-page-copy";

/**
 * Dựng tĩnh lúc có người vào lần đầu rồi cache (ISR), không dựng lúc build —
 * vì máy build không có backend.
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mau-thiep/[templateSlug]">): Promise<Metadata> {
  const { locale, templateSlug } = await params;
  if (!isLocale(locale)) return {};

  const template = await getCatalogTemplateBySlug(templateSlug);
  if (!template) return {};

  const dict = await getDictionary(locale);
  const copy = templatePageCopy(dict, template.slug);

  return buildMetadata({
    locale,
    path: `/mau-thiep/${template.slug}`,
    // Title riêng của mẫu nếu có; mẫu chưa viết thì vẫn còn dạng chỉ-có-tên.
    title:
      copy?.metaTitle ??
      fill(dict.templatePages.metaTitle, { name: template.name }),
    description:
      copy?.metaDescription ??
      fill(dict.templatePages.genericLead, {
        name: template.name,
        styles: template.categories
          .map((category) => dict.templates.categories[category])
          .join(", ")
          .toLowerCase(),
      }),
    // Mẫu chưa có chữ giới thiệu thì trang chỉ còn tên, nhãn và ảnh — 60 trang
    // như vậy chỉ khác nhau cái tên, Google coi là trùng lặp. Vẫn `follow` để
    // con bò đi tiếp sang các mẫu liên quan. Xem `lib/template-page-copy.ts`.
    noIndex: !copy,
  });
}

/**
 * Trang giới thiệu một mẫu thiệp — trang đích SEO của mẫu đó.
 *
 * Tấm thiệp đầy đủ (phong bì, nhạc nền) vẫn ở `./demo` và vẫn `noindex`: đó là
 * dữ liệu của một cặp đôi không có thật, không phải chữ mô tả mẫu. Trang này
 * nói về chính mẫu — nó là gì, hợp với ai, có những gì — rồi dẫn sang demo.
 */
export default async function TemplatePage({
  params,
}: PageProps<"/[locale]/mau-thiep/[templateSlug]">) {
  const { locale, templateSlug } = await params;
  if (!isLocale(locale)) notFound();

  const template = await getCatalogTemplateBySlug(templateSlug);
  if (!template) notFound();

  const [dict, templates] = await Promise.all([
    getDictionary(locale),
    // Hỏng mềm: backend trượt thì trang vẫn lên, chỉ mất khối mẫu tương tự.
    getTemplates().catch(() => []),
  ]);
  const copy = templatePageCopy(dict, template.slug);

  const related = templates
    .filter(
      (item) =>
        item.slug !== template.slug &&
        item.categories.some((category) =>
          template.categories.includes(category),
        ),
    )
    .slice(0, 4);

  return (
    <>
      <SiteHeader
        dict={dict.common}
        locale={locale}
      />
      <main>
        <TemplateLanding
          template={template}
          related={related}
          copy={copy}
          dict={dict}
          locale={locale}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
      <TemplateViewBeacon slug={template.slug} kind="open" />

      <JsonLd
        data={breadcrumbSchema(locale, dict.templatePages.breadcrumbHome, [
          { name: dict.templatePages.breadcrumbTemplates, path: "/mau-thiep" },
          { name: template.name, path: `/mau-thiep/${template.slug}` },
        ])}
      />
      {/* Chỉ khai FAQ khi trang thật sự hiện FAQ — điều kiện của Google. */}
      {copy ? <JsonLd data={faqSchema(copy.faqs)} /> : null}

      {/* Mô tả chính mẫu thiệp. Chỉ khai khi đã có chữ giới thiệu: mẫu chưa
          viết thì trang đang `noindex`, khai thêm schema cho nó là vô nghĩa. */}
      {copy ? (
        <JsonLd
          data={templateSchema({
            locale,
            slug: template.slug,
            name: template.name,
            description: copy.metaDescription,
          })}
        />
      ) : null}
    </>
  );
}
