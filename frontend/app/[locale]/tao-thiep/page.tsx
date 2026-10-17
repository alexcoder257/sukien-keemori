import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KindPicker } from "@/components/create/kind-picker";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { breadcrumbSchema } from "@/lib/schema-org";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tao-thiep">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/tao-thiep",
    title: dict.create.meta.title,
    description: dict.create.meta.description,
  });
}

/**
 * Bước 1 của việc tạo thiệp: chọn loại. Mỗi loại mở editor với một form riêng
 * (`KIND_EDITOR_BLOCKS`), nên loại phải được chọn **trước** khi có form.
 *
 * Trang tĩnh: không đọc request — trạng thái đăng nhập không đổi gì ở đây, việc
 * đăng nhập chỉ xảy ra lúc lưu thiệp trong editor.
 */
export default async function CreatePage({
  params,
}: PageProps<"/[locale]/tao-thiep">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <SiteHeader dict={dict.common} locale={locale} />
      <main>
        <KindPicker dict={dict.create} locale={locale} />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />

      <JsonLd
        data={breadcrumbSchema(locale, dict.common.nav.home, [
          { name: dict.create.title, path: "/tao-thiep" },
        ])}
      />
    </>
  );
}
